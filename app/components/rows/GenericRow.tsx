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
          <h3 className="display text-lg">{s(sn.title) ?? `Schema ${String(hit.id)}`}</h3>
          {s(sn.description) && <p className="mt-1 text-sm text-muted line-clamp-2">{s(sn.description)}</p>}
          {n(sn.ecosystemId) != null && (
            <p className="mt-1 font-mono text-xs text-muted">ecosystem {String(sn.ecosystemId)}</p>
          )}
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
          {s(sn.policyAddress) && <p className="font-mono text-xs text-muted truncate">{s(sn.policyAddress)}</p>}
          {s(sn.deposit) && <p className="text-sm text-muted">deposit {s(sn.deposit)}</p>}
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
