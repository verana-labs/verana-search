import type { SearchSurface } from './types'

/**
 * Data-driven filter panel definitions: the [TG-FCT-3] filter set per
 * surface, per [SRCH-FORM-3] of spec.md.
 */

export type FilterKind =
  | 'select' // eq (optionally populated from facets)
  | 'multiselect' // in
  | 'text' // eq free input
  | 'prefix' // { prefix: ... }
  | 'range' // { range: { gte, lte } }
  | 'tags' // containsAny

export type FilterDef = {
  key: string
  label: string
  kind: FilterKind
  options?: string[]
}

const ROLE_OPTIONS = ['HOLDER', 'ISSUER', 'VERIFIER', 'ISSUER_GRANTOR', 'VERIFIER_GRANTOR', 'ECOSYSTEM']

export const FILTERS: Record<SearchSurface, FilterDef[]> = {
  Did: [
    { key: 'Did.pattern', label: 'Pattern', kind: 'select', options: ['A', 'B'] },
    {
      key: 'Did.operatorKind',
      label: 'Operator kind',
      kind: 'select',
      options: ['Organization', 'Persona'],
    },
    { key: 'Did.serviceTypes', label: 'Endpoint types', kind: 'tags' },
    { key: 'Did.corporationId', label: 'Corporation id', kind: 'text' },
    {
      key: 'EcsCredential.ServiceCredential.type',
      label: 'Service type',
      kind: 'text',
    },
    {
      key: 'EcsCredential.ServiceCredential.minimumAgeRequired',
      label: 'Minimum age',
      kind: 'range',
    },
    {
      key: 'OrganizationCredential.countryCode',
      label: 'Org country',
      kind: 'text',
    },
    {
      key: 'OrganizationCredential.legalJurisdiction',
      label: 'Org jurisdiction (prefix)',
      kind: 'prefix',
    },
    {
      key: 'OrganizationCredential.organizationKind',
      label: 'Org kind',
      kind: 'text',
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
      kind: 'text',
    },
    {
      key: 'PersonaCredential.controllerJurisdiction',
      label: 'Persona jurisdiction (prefix)',
      kind: 'prefix',
    },
    {
      key: 'Participant.ecosystemId',
      label: 'Ecosystem id',
      kind: 'text',
    },
    {
      key: 'Participant.credentialSchemaId',
      label: 'Schema id',
      kind: 'text',
    },
    {
      key: 'Participant.role',
      label: 'Role',
      kind: 'select',
      options: ROLE_OPTIONS,
    },
  ],
  Ecosystem: [
    { key: 'corporationId', label: 'Corporation id', kind: 'text' },
    { key: 'issuedCredentials', label: 'Issued credentials', kind: 'range' },
    { key: 'verifiedCredentials', label: 'Verified credentials', kind: 'range' },
  ],
  Corporation: [
    { key: 'deposit', label: 'Deposit', kind: 'range' },
    { key: 'slashedEvents', label: 'Slash events', kind: 'range' },
  ],
  CredentialSchema: [
    { key: 'ecosystemId', label: 'Ecosystem id', kind: 'text' },
    { key: 'issuedCredentials', label: 'Issued credentials', kind: 'range' },
    { key: 'verifiedCredentials', label: 'Verified credentials', kind: 'range' },
  ],
  ServiceEndpoint: [{ key: 'type', label: 'Endpoint type', kind: 'text' }],
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
