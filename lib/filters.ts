import type { FilterValue, SearchSurface } from './types'

/**
 * Data-driven filter panel definitions: the [TG-FCT-3] filter set per
 * surface, per [SRCH-FORM-3] of spec.md.
 */

export type FilterKind =
  | 'multiselect' // eq for one value, in for several
  | 'boolean' // eq true / false
  | 'text' // eq free input
  | 'prefix' // { prefix: ... }
  | 'range' // { range: { gte, lte } }
  | 'dateRange' // { range: { gte, lte } } as ISO date-times
  | 'tags' // containsAny

export type FilterDef = {
  key: string
  label: string
  kind: FilterKind
  options?: string[]
  placeholder?: string
  /** Multiplies the typed value into the wire unit (VNA to uvna). */
  scale?: number
}

type Scalar = string | number | boolean

export function selectedValues(value: FilterValue | undefined): Scalar[] {
  if (value === undefined) return []
  if (Array.isArray(value)) return value
  if (typeof value !== 'object') return [value]
  if (value.in) return value.in
  return value.eq !== undefined ? [value.eq] : []
}

export function toggleValue(def: FilterDef, value: FilterValue | undefined, v: Scalar): FilterValue | null {
  const selected = selectedValues(value)
  const on = selected.some((s) => String(s) === String(v))
  if (def.kind !== 'multiselect') return on ? null : v
  const next = on ? selected.filter((s) => String(s) !== String(v)) : [...selected, v]
  if (next.length === 0) return null
  return next.length === 1 ? next[0] : { in: next }
}

const ROLE_OPTIONS = ['HOLDER', 'ISSUER', 'VERIFIER', 'ISSUER_GRANTOR', 'VERIFIER_GRANTOR', 'ECOSYSTEM']

export const FILTERS: Record<SearchSurface, FilterDef[]> = {
  Did: [
    { key: 'Did.pattern', label: 'Pattern', kind: 'multiselect', options: ['A', 'B'] },
    {
      key: 'Did.operatorKind',
      label: 'Operator kind',
      kind: 'multiselect',
      options: ['Organization', 'Persona'],
    },
    { key: 'Did.operatorName', label: 'Operator name (prefix)', kind: 'prefix', placeholder: 'e.g. Verana' },
    { key: 'Did.serviceTypes', label: 'Endpoint types', kind: 'tags', placeholder: 'e.g. MCP, DIDCommMessaging' },
    { key: 'Did.corporationId', label: 'Corporation id', kind: 'text' },
    { key: 'Did.isCorporation', label: 'Is a corporation', kind: 'boolean' },
    { key: 'Did.isEcosystem', label: 'Controls an ecosystem', kind: 'boolean' },
    { key: 'Did.ecosystemIds', label: 'Controlled ecosystem ids', kind: 'tags', placeholder: 'e.g. 24, 25' },
    {
      key: 'EcsCredential.ServiceCredential.type',
      label: 'Service type',
      kind: 'multiselect',
    },
    {
      key: 'EcsCredential.ServiceCredential.minimumAgeRequired',
      label: 'Minimum age',
      kind: 'range',
    },
    {
      key: 'OrganizationCredential.countryCode',
      label: 'Org country',
      kind: 'multiselect',
    },
    {
      key: 'OrganizationCredential.legalJurisdiction',
      label: 'Org jurisdiction (prefix)',
      kind: 'prefix',
      placeholder: 'e.g. CO-DC',
    },
    {
      key: 'OrganizationCredential.organizationKind',
      label: 'Org kind',
      kind: 'multiselect',
    },
    { key: 'OrganizationCredential.lei', label: 'LEI', kind: 'text' },
    {
      key: 'OrganizationCredential.registryId',
      label: 'Registry id',
      kind: 'text',
    },
    {
      key: 'PersonaCredential.controllerCountryCode',
      label: 'Persona country',
      kind: 'multiselect',
    },
    {
      key: 'PersonaCredential.controllerJurisdiction',
      label: 'Persona jurisdiction (prefix)',
      kind: 'prefix',
      placeholder: 'e.g. CO-DC',
    },
    {
      key: 'Participant.ecosystemId',
      label: 'Ecosystem id',
      kind: 'multiselect',
    },
    {
      key: 'Participant.credentialSchemaId',
      label: 'Schema id',
      kind: 'multiselect',
    },
    {
      key: 'Participant.role',
      label: 'Role',
      kind: 'multiselect',
      options: ROLE_OPTIONS,
    },
  ],
  Ecosystem: [
    { key: 'corporationId', label: 'Corporation id', kind: 'text' },
    { key: 'issuedCredentials', label: 'Issued credentials', kind: 'range' },
    { key: 'verifiedCredentials', label: 'Verified credentials', kind: 'range' },
    ...ROLE_OPTIONS.map(
      (role): FilterDef => ({ key: `participants[${role}]`, label: `${role} participants`, kind: 'range' })
    ),
  ],
  Corporation: [
    { key: 'deposit', label: 'Deposit (VNA)', kind: 'range', scale: 1_000_000 },
    { key: 'slashedEvents', label: 'Slash events', kind: 'range' },
    { key: 'lastSlashedAtTime', label: 'Last slashed', kind: 'dateRange' },
  ],
  CredentialSchema: [
    { key: 'ecosystemId', label: 'Ecosystem id', kind: 'multiselect' },
    { key: 'issuedCredentials', label: 'Issued credentials', kind: 'range' },
    { key: 'verifiedCredentials', label: 'Verified credentials', kind: 'range' },
  ],
  ServiceEndpoint: [{ key: 'type', label: 'Endpoint type', kind: 'multiselect' }],
}

/** Surfaces on which each visibility-gate override applies ([TG-FCT-2]). */
export const GATE_SURFACES: Record<'includeUntrusted' | 'includeArchived', SearchSurface[]> = {
  includeUntrusted: ['Did', 'ServiceEndpoint'],
  includeArchived: ['Ecosystem', 'CredentialSchema'],
}

export const SURFACE_LABELS: Record<SearchSurface, string> = {
  Did: 'Services',
  Ecosystem: 'Ecosystems',
  Corporation: 'Corporations',
  CredentialSchema: 'Credential Schemas',
  ServiceEndpoint: 'Service Endpoints',
}
