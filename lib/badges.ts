/** Endpoint type badge normalization, per [SRCH-RES-1] of the Verana Search spec (verana-spec/v4/verana-search). */

const LABELS: Record<string, string> = {
  didcommmessaging: 'DIDCOMM',
  'did-communication': 'DIDCOMM',
  linkeddomains: 'WEBSITE',
  vsagentadminapi: 'ADMIN API',
}

/** Normalized display label for one DID Document service type. */
export function badgeLabel(type: string): string {
  return LABELS[type.toLowerCase()] ?? type.toUpperCase()
}

/**
 * Deduplicated, ordered badge labels: DIDCOMM first, then alphabetical.
 * Returns [labels, rawTypeByLabel] so a click can set the raw-type filter.
 */
export function badgeList(types: string[]): {
  label: string
  rawType: string
}[] {
  const seen = new Map<string, string>() // label -> first raw type
  for (const t of types) {
    const label = badgeLabel(t)
    if (!seen.has(label)) seen.set(label, t)
  }
  return [...seen.entries()]
    .map(([label, rawType]) => ({ label, rawType }))
    .sort((a, b) => (a.label === 'DIDCOMM' ? -1 : b.label === 'DIDCOMM' ? 1 : a.label.localeCompare(b.label)))
}

export const MAX_BADGES = 5
