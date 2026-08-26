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

/* Owner-Corporation trust signals ([SRCH-ENR-2a]), cached per Corporation
   so hits of the same owner resolve at most once. */
type CorporationSignals = {
  deposit: number | null;
  slashCount: number | null;
  lastSlashed: string | null;
  slashedDeposit: number | null;
};

const corporationCache = new Map<number, Promise<CorporationSignals>>();

export function getCorporationSignals(
  config: AppConfig,
  corporationId: number,
): Promise<CorporationSignals> {
  const cached = corporationCache.get(corporationId);
  if (cached) return cached;

  const promise = (async (): Promise<CorporationSignals> => {
    const res = await fetch(
      `${config.resolverBaseUrl}/v4/corporation/get/${corporationId}?gf_data=none`,
    );
    if (!res.ok) throw new ApiError(res.status, null, `HTTP ${res.status}`);
    const json = (await res.json()) as {
      corporation?: {
        deposit?: number;
        slash_count?: number;
        last_slashed?: string | null;
        slashed_deposit?: number;
      };
    };
    const c = json.corporation ?? {};
    return {
      deposit: typeof c.deposit === "number" ? c.deposit : null,
      slashCount: typeof c.slash_count === "number" ? c.slash_count : null,
      lastSlashed: c.last_slashed ?? null,
      slashedDeposit:
        typeof c.slashed_deposit === "number" ? c.slashed_deposit : null,
    };
  })();

  promise.catch(() => corporationCache.delete(corporationId));
  corporationCache.set(corporationId, promise);
  return promise;
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

  // [SRCH-ENR-2a] owner-Corporation trust signals (best effort).
  let corp: CorporationSignals | null = null;
  if (typeof own.corporationId === "number") {
    try {
      corp = await getCorporationSignals(config, own.corporationId);
    } catch {
      // signals stay null; the row degrades gracefully
    }
  }
  const neverSlashed = (corp?.slashCount ?? 0) === 0;

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
    corporationId: own.corporationId ?? null,
    corporationDeposit: corp?.deposit ?? null,
    corporationSlashedEvents: corp?.slashCount ?? null,
    corporationLastSlashedAtTime: neverSlashed ? null : corp?.lastSlashed ?? null,
    corporationSlashedValue: neverSlashed ? null : corp?.slashedDeposit ?? null,
  };
}

/** Formats a Coin value ("40000000uvna" or micro-denom number) as VNA. */
export function formatVna(value: string | number | null): string | null {
  if (value === null) return null;
  let micro: number;
  if (typeof value === "number") {
    micro = value;
  } else {
    const match = value.match(/^(\d+)\s*uvna$/i) ?? value.match(/^(\d+)$/);
    if (!match) return value; // unknown denom: show verbatim
    micro = Number(match[1]);
  }
  const vna = micro / 1_000_000;
  return `${vna.toLocaleString("en-US", { maximumFractionDigits: 2 })} VNA`;
}
