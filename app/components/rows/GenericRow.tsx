'use client'

import { formatVna } from '../../../lib/api'
import { truncateDid } from '../../../lib/flag'
import type { DidCardSnippet, SearchHit } from '../../../lib/types'
import { CopyDidButton, cardFromGroups, OperatorZone, ServiceIdentity, TrustChip } from './DidRow'

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
function endpointUris(v: unknown): string[] {
  if (Array.isArray(v)) return v.flatMap(endpointUris)
  const uri = s(v) ?? (v && typeof v === 'object' ? s((v as Record<string, unknown>).uri) : null)
  return uri ? [uri] : []
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
  const didCard = sn.didCard as DidCardSnippet | undefined
  const card = didCard
    ? cardFromGroups({ service: didCard.service, operator: didCard.operator, corporation: hit.snippet.corporation })
    : null
  const stats = sn.stats as
    | { participants: Record<string, number>; issuedCredentials: number; verifiedCredentials: number }
    | undefined
  const participants = Object.entries(stats?.participants ?? {})

  return (
    <article className="card p-5">
      <div className={card ? 'grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-5' : undefined}>
        <div className="min-w-0">
          <div className="flex items-center justify-between">
            <span className="eyebrow">{EYEBROWS[hit.type] ?? hit.type}</span>
            <div className="flex gap-2">
              {archived && <span className="chip">Archived</span>}
              {n(sn.id) != null && <span className="chip">id {String(sn.id)}</span>}
              {didCard && <TrustChip trusted={didCard.trusted && !didCard.isTrustExpired} />}
            </div>
          </div>

          {didCard && <ServiceIdentity card={card} did={didCard.did} />}

          {hit.type === 'CredentialSchema' && (
            <div className="mt-2">
              <h3 className="display text-lg">{title ?? `Schema ${String(hit.id)}`}</h3>
              {description && <p className="mt-1 text-sm text-muted line-clamp-2">{description}</p>}
              {ecosystemId != null && (
                <p className="mt-1 font-mono text-xs text-muted">ecosystem {String(ecosystemId)}</p>
              )}
            </div>
          )}

          {hit.type === 'ServiceEndpoint' && (
            <div className="mt-2">
              <span className="chip chip-endpoint">{s(sn.type) ?? '?'}</span>
              {endpointUris(sn.serviceEndpoint).map((uri) => (
                <p key={uri} className="mt-2 font-mono text-xs text-muted truncate" title={uri}>
                  {uri}
                </p>
              ))}
            </div>
          )}

          {hit.type === 'Corporation' && (
            <div className="mt-2 space-y-1">
              {policyAddress && <p className="font-mono text-xs text-muted truncate">{policyAddress}</p>}
              {deposit && <p className="text-sm text-muted">deposit {formatVna(deposit)}</p>}
            </div>
          )}

          {hit.type === 'Ecosystem' && stats && (
            <div className="mt-2 space-y-0.5 font-mono text-xs text-muted">
              {participants.length > 0 && (
                <p>participants {participants.map(([role, count]) => `${role} ${count}`).join(' · ')}</p>
              )}
              <p>
                credentials issued {stats.issuedCredentials} · verified {stats.verifiedCredentials}
              </p>
            </div>
          )}

          {did && (
            <div className="mt-2 flex items-center gap-2">
              <p className="font-mono text-xs text-muted truncate" title={did}>
                {truncateDid(did)}
              </p>
              <CopyDidButton did={did} />
            </div>
          )}
        </div>
        {card && <OperatorZone card={card} />}
      </div>
    </article>
  )
}
