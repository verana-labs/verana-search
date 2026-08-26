import type {
  AppConfig,
} from "./config";
import type {
  DidCard,
  EcsCredential,
  GraphError,
  ResolveResponse,
  SearchRequest,
  SearchResponse,
} from "./types";

/** Error carrying the typed [TG-ERR-1] code when the graph returned one. */
export class ApiError extends Error {
  code: string | null;
  status: number;
  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function postJson<T>(
  url: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    let code: string | null = null;
    let message = `HTTP ${res.status}`;
    try {
      const err = (await res.json()) as GraphError;
      code = err.error?.code ?? null;
      message = err.error?.message ?? message;
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, code, message);
  }
  return (await res.json()) as T;
}

/** [SRCH-FORM-4] search call. */
export function searchGraph(
  config: AppConfig,
  request: SearchRequest,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  return postJson<SearchResponse>(
    `${config.graphBaseUrl}/v4/graph/search`,
    request,
    signal,
  );
}

/* --- Resolver enrichment ([SRCH-ENR-2] / [SRCH-ENR-3]) -------------------- */

const MAX_CONCURRENT_RESOLVES = 6;
let inFlight = 0;
const waiters: Array<() => void> = [];

async function acquire(): Promise<void> {
  if (inFlight < MAX_CONCURRENT_RESOLVES) {
    inFlight++;
    return;
  }
  await new Promise<void>((resolve) => waiters.push(resolve));
  inFlight++;
}

function release(): void {
  inFlight--;
  const next = waiters.shift();
  if (next) next();
}

/** In-memory cache keyed by `${did}|${lastObservedAtTime}` ([SRCH-ENR-3]). */
const resolveCache = new Map<string, Promise<ResolveResponse>>();

export function resolveDid(
  config: AppConfig,
  did: string,
  cacheKeySuffix = "",
): Promise<ResolveResponse> {
  const key = `${did}|${cacheKeySuffix}`;
  const cached = resolveCache.get(key);
  if (cached) return cached;

  const promise = (async () => {
    await acquire();
    try {
      return await postJson<ResolveResponse>(
        `${config.resolverBaseUrl}/v4/verifiable-trust/resolve`,
        { did, ecsCredentials: true, services: true },
      );
    } finally {
      release();
    }
  })();

  // Do not cache failures.
  promise.catch(() => resolveCache.delete(key));
  resolveCache.set(key, promise);
  return promise;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function findCred(
  creds: EcsCredential[] | undefined,
  ecsSchema: string,
): EcsCredential | undefined {
  return creds?.find((c) => c.ecsSchema === ecsSchema);
}

/**
 * Builds the DidRow card from resolver data. Pattern B: when the DID's own
 * resolve carries no ORG/PERSONA credential, resolve the Service credential
 * issuer's Participant to find the operator DID, then resolve that DID.
 */
export async function buildDidCard(
  config: AppConfig,
  did: string,
  cacheKeySuffix: string,
): Promise<DidCard> {
  const own = await resolveDid(config, did, cacheKeySuffix);

  const service = findCred(own.ecsCredentials, "ServiceCredential");
  let org = findCred(own.ecsCredentials, "OrganizationCredential");
  let persona = findCred(own.ecsCredentials, "PersonaCredential");

  // Pattern B: operator identity lives on the issuer DID.
  if (!org && !persona && service?.issuerParticipantId != null) {
    try {
      const pRes = await fetch(
        `${config.resolverBaseUrl}/v4/participant/get/${service.issuerParticipantId}`,
      );
      if (pRes.ok) {
        const pJson = (await pRes.json()) as {
          participant?: { did?: string };
        };
        const issuerDid = pJson.participant?.did;
        if (issuerDid && issuerDid !== did) {
          const issuer = await resolveDid(config, issuerDid, "");
          org = findCred(issuer.ecsCredentials, "OrganizationCredential");
          persona = findCred(issuer.ecsCredentials, "PersonaCredential");
        }
      }
    } catch {
      // operator identity stays null; the row degrades gracefully
    }
  }

  const s = service?.credentialSubject ?? {};
  const o = org?.credentialSubject;
  const p = persona?.credentialSubject;

  return {
    serviceName: str(s["name"]),
    serviceType: str(s["type"]),
    serviceDescription: str(s["description"]),
    serviceLogoUri: str(s["logoUri"]),
    operatorName: str(o?.["name"]) ?? str(p?.["name"]),
    operatorLogoUri: str(o?.["logoUri"]) ?? str(p?.["avatarUri"]),
    operatorCountryCode:
      str(o?.["countryCode"]) ?? str(p?.["controllerCountryCode"]),
    operatorRegistryId: str(o?.["registryId"]),
    operatorAddress: str(o?.["address"]),
    endpointTypes: (own.services ?? []).map((e) => e.type),
  };
}
