/** Types mirroring the Verana Graph search contract and the resolver payloads. */

export type SearchSurface =
  | "Did"
  | "Ecosystem"
  | "Corporation"
  | "CredentialSchema"
  | "ServiceEndpoint";

export type FilterValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>
  | {
      eq?: string | number | boolean;
      in?: Array<string | number | boolean>;
      range?: { gt?: number; gte?: number; lt?: number; lte?: number };
      prefix?: string;
      contains?: string;
      containsAny?: string[];
    };

export type SearchRequest = {
  surface: SearchSurface;
  freeText?: string;
  filters?: Record<string, FilterValue>;
  limit?: number;
  cursor?: string | null;
  includeUntrusted?: boolean;
  includeArchived?: boolean;
};

/** Graph service-endpoint projection (TG-FCT-6a `serviceEndpoints[]`). */
export type ServiceEndpointRef = {
  id: string;
  type: string;
  serviceEndpoint: string | object;
};

/**
 * Did-surface snippet. Pre-TG-FCT-6a graphs return only the first group;
 * post-PR-62 graphs add the card fields (feature-detected, [SRCH-ENR-4]).
 */
export type DidSnippet = {
  did: string;
  lastObservedAtTime: string;
  isTrustExpired: boolean;
  trusted?: boolean;
  pattern?: "A" | "B" | null;
  operatorKind?: "Organization" | "Persona" | null;
  corporationId?: number;
  // TG-FCT-6a card fields (may be absent on older graphs)
  serviceName?: string | null;
  serviceType?: string | null;
  serviceDescription?: string | null;
  serviceLogoUri?: string | null;
  serviceLogoDigestSri?: string | null;
  operatorName?: string | null;
  operatorLogoUri?: string | null;
  operatorLogoDigestSri?: string | null;
  operatorCountryCode?: string | null;
  serviceEndpoints?: ServiceEndpointRef[];
  corporationDeposit?: string | null;
  corporationSlashedEvents?: number | null;
  corporationLastSlashedAtTime?: string | null;
  corporationSlashedValue?: string | null;
};

export type GenericSnippet = Record<string, unknown>;

export type SearchHit = {
  type: SearchSurface;
  id: string | number;
  score: number;
  snippet: DidSnippet & GenericSnippet;
  highlights?: string[];
};

export type FacetEntry = { value: string | number | boolean; count: number };

export type SearchResponse = {
  query: unknown;
  totalCount: number;
  hits: SearchHit[];
  facets: Record<string, FacetEntry[]>;
  cursor: string | null;
};

export type GraphError = { error: { code: string; message: string } };

/* --- Resolver ([IDX-VT-QRY-1]) -------------------------------------------- */

export type EcsCredential = {
  ecsSchema:
    | "ServiceCredential"
    | "OrganizationCredential"
    | "PersonaCredential"
    | string;
  ecsSchemaVersion?: string;
  credentialSchemaId?: number;
  issuerParticipantId?: number;
  ecosystemId?: number;
  participantId?: number;
  id: string;
  digestJCS?: string;
  issuedAtTime?: string;
  validFrom?: string;
  validUntil?: string | null;
  credentialSubject: Record<string, unknown> & { id?: string };
};

export type ResolveResponse = {
  did: string;
  trusted: boolean;
  evaluatedAtTime: string;
  evaluatedAtBlock: number;
  expiresAtTime: string | null;
  corporationId: number;
  ecsCredentials?: EcsCredential[];
  services?: Array<{
    id: string;
    type: string;
    serviceEndpoint: string | object;
    accept?: string[];
  }>;
};

/** Card model consumed by DidRow, built from snippet or enrichment. */
export type DidCard = {
  serviceName: string | null;
  serviceType: string | null;
  serviceDescription: string | null;
  serviceLogoUri: string | null;
  operatorName: string | null;
  operatorLogoUri: string | null;
  operatorCountryCode: string | null;
  operatorRegistryId: string | null;
  operatorAddress: string | null;
  endpointTypes: string[];
  /** Owner-Corporation trust signals ([SRCH-ENR-2a]). */
  corporationId: number | null;
  corporationDeposit: string | number | null;
  corporationSlashedEvents: number | null;
  corporationLastSlashedAtTime: string | null;
  corporationSlashedValue: string | number | null;
};
