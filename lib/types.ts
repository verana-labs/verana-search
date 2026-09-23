/** Types mirroring the Verana Graph search contract and the resolver payloads. */

export type SearchSurface = 'Did' | 'Ecosystem' | 'Corporation' | 'CredentialSchema' | 'ServiceEndpoint'

export type FilterValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>
  | {
      eq?: string | number | boolean
      in?: Array<string | number | boolean>
      range?: { gt?: number; gte?: number; lt?: number; lte?: number }
      prefix?: string
      contains?: string
      containsAny?: string[]
    }

export type SearchRequest = {
  surface: SearchSurface
  freeText?: string
  filters?: Record<string, FilterValue>
  limit?: number
  cursor?: string | null
  includeUntrusted?: boolean
  includeArchived?: boolean
}

/** One entry of the `endpoints` group (`serviceEndpoints[]` on the earlier graph generation). */
export type ServiceEndpointRef = {
  id: string
  type: string
  serviceEndpoint: string | object
}

/** TG-FCT-6b `service` group of a Did hit, `null` when the DID presents no ServiceCredential. */
export type DidSnippetService = {
  pattern: 'A' | 'B' | null
  name: string
  type: string | null
  description: string | null
  logoUri: string | null
  logoDigestSri: string | null
}

/** TG-FCT-6b `operator` group, `null` when the trust chain is incomplete. */
export type DidSnippetOperator = {
  kind: 'Organization' | 'Persona'
  name: string | null
  logoUri: string | null
  logoDigestSri: string | null
  countryCode: string | null
  registryId: string | null
  address: string | null
}

/** TG-FCT-6b `corporation` group, the owner Corporation's trust signals. */
export type DidSnippetCorporation = {
  id: number | null
  deposit: string | null
  slashedEvents: number | null
  lastSlashedAtTime: string | null
  slashedValue: string | null
}

/** TG-FCT-6b `didCard` group, the bound DID of an Ecosystem, Corporation or ServiceEndpoint hit. */
export type DidCardSnippet = {
  did: string
  trusted: boolean
  isTrustExpired: boolean
  service: DidSnippetService | null
  operator: DidSnippetOperator | null
}

/**
 * Did-surface snippet. Three graph generations are feature-detected per hit ([SRCH-ENR-4]):
 * the TG-FCT-6b groups (`service`, `operator`, `corporation`, `endpoints`, `ecosystems`),
 * the earlier flat card fields, or the bare minimum that needs the resolver.
 */
export type DidSnippet = {
  did: string
  lastObservedAtTime: string
  isTrustExpired: boolean
  trusted?: boolean
  isCorporation?: boolean
  isEcosystem?: boolean
  service?: DidSnippetService | null
  operator?: DidSnippetOperator | null
  corporation?: DidSnippetCorporation
  endpoints?: ServiceEndpointRef[]
  ecosystems?: Array<{ id: number; archived: boolean }>
  pattern?: 'A' | 'B' | null
  operatorKind?: 'Organization' | 'Persona' | null
  corporationId?: number
  // flat card fields of the earlier graph generation
  serviceName?: string | null
  serviceType?: string | null
  serviceDescription?: string | null
  serviceLogoUri?: string | null
  serviceLogoDigestSri?: string | null
  operatorName?: string | null
  operatorLogoUri?: string | null
  operatorLogoDigestSri?: string | null
  operatorCountryCode?: string | null
  serviceEndpoints?: ServiceEndpointRef[]
  ecosystemIds?: number[]
  corporationDeposit?: string | null
  corporationSlashedEvents?: number | null
  corporationLastSlashedAtTime?: string | null
  corporationSlashedValue?: string | null
}

export type GenericSnippet = Record<string, unknown>

export type SearchHit = {
  type: SearchSurface
  id: string | number
  score: number
  snippet: DidSnippet & GenericSnippet
  highlights?: string[]
}

export type FacetEntry = { value: string | number | boolean; count: number }

export type SearchResponse = {
  query: unknown
  totalCount: number
  hits: SearchHit[]
  facets: Record<string, FacetEntry[]>
  cursor: string | null
}

export type GraphError = { error: { code: string; message: string } }

/* --- Resolver ([IDX-VT-QRY-1]) -------------------------------------------- */

export type EcsCredential = {
  ecsSchema: 'ServiceCredential' | 'OrganizationCredential' | 'PersonaCredential' | string
  ecsSchemaVersion?: string
  credentialSchemaId?: number
  issuerParticipantId?: number
  ecosystemId?: number
  participantId?: number
  id: string
  digestJCS?: string
  issuedAtTime?: string
  validFrom?: string
  validUntil?: string | null
  credentialSubject: Record<string, unknown> & { id?: string }
}

export type ResolveResponse = {
  did: string
  trusted: boolean
  evaluatedAtTime: string
  evaluatedAtBlock: number
  expiresAtTime: string | null
  corporationId: number
  corporation?: { id: number } | null
  ecosystems?: Array<{ id: number; archived?: boolean }>
  ecsCredentials?: EcsCredential[]
  services?: Array<{
    id: string
    type: string
    serviceEndpoint: string | object
    accept?: string[]
  }>
}

/** Card model consumed by DidRow, built from snippet or enrichment. */
export type DidCard = {
  serviceName: string | null
  serviceType: string | null
  serviceDescription: string | null
  serviceLogoUri: string | null
  operatorName: string | null
  operatorLogoUri: string | null
  operatorCountryCode: string | null
  operatorRegistryId: string | null
  operatorAddress: string | null
  endpointTypes: string[]
  /** Entity bindings: the DID is a Corporation / controls Ecosystems. */
  isCorporation: boolean
  isEcosystem: boolean
  ecosystemIds: number[]
  /** Owner-Corporation trust signals ([SRCH-ENR-2a]). */
  corporationId: number | null
  corporationDeposit: string | number | null
  corporationSlashedEvents: number | null
  corporationLastSlashedAtTime: string | null
  corporationSlashedValue: string | number | null
}
