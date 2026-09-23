'use client'

import { truncateDid } from '../../../lib/flag'
import type { SearchHit } from '../../../lib/types'

const EYEBROWS: Record<string, string> = {
  Ecosystem: 'Ecosystem',
  Corporation: 'Corporation',
  CredentialSchema: 'Credential Schema',
  ServiceEndpoint: 'Service Endpoint',
}

function s(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}
function n(v: unknown): number | null {
  return typeof v === 'number' ? v : null
}

/** Snippet-only rows for the non-Did surfaces ([SRCH-RES-2]). */
export default function GenericRow({ hit }: { hit: SearchHit }) {
  const sn = hit.snippet as Record<string, unknown>
  const archived = sn.archived === true
  const did = s(sn.did) ?? s(sn.didId)
  const schema = (sn.schema ?? {}) as Record<string, unknown>
  const ecosystem = (sn.ecosystem ?? {}) as Record<string, unknown>
  const trust = (sn.trust ?? {}) as Record<string, unknown>
  const title = s(schema.title) ?? s(sn.title)
  const description = s(schema.description) ?? s(sn.description)
  const ecosystemId = n(ecosystem.id) ?? n(sn.ecosystemId)
  const policyAddress = s(trust.policyAddress) ?? s(sn.policyAddress)
  const deposit = s(trust.deposit) ?? s(sn.deposit)

  return (
    <article className="card p-5">
      <div className="flex items-center justify-between">
        <span className="eyebrow">{EYEBROWS[hit.type] ?? hit.type}</span>
        <div className="flex gap-2">
          {archived && <span className="chip">Archived</span>}
          {n(sn.id) != null && <span className="chip">id {String(sn.id)}</span>}
        </div>
      </div>

      {hit.type === 'CredentialSchema' && (
        <div className="mt-2">
          <h3 className="display text-lg">{title ?? `Schema ${String(hit.id)}`}</h3>
          {description && <p className="mt-1 text-sm text-muted line-clamp-2">{description}</p>}
          {ecosystemId != null && <p className="mt-1 font-mono text-xs text-muted">ecosystem {String(ecosystemId)}</p>}
        </div>
      )}

      {hit.type === 'ServiceEndpoint' && (
        <div className="mt-2">
          <span className="chip chip-endpoint">{s(sn.type) ?? '?'}</span>
          {s(sn.serviceEndpoint) && (
            <p className="mt-2 font-mono text-xs text-muted truncate">{s(sn.serviceEndpoint)}</p>
          )}
        </div>
      )}

      {hit.type === 'Corporation' && (
        <div className="mt-2 space-y-1">
          {policyAddress && <p className="font-mono text-xs text-muted truncate">{policyAddress}</p>}
          {deposit && <p className="text-sm text-muted">deposit {deposit}</p>}
        </div>
      )}

      {did && (
        <p className="mt-2 font-mono text-xs text-muted" title={did}>
          {truncateDid(did)}
        </p>
      )}
    </article>
  )
}
