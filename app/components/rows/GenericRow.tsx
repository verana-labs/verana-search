'use client'

import { formatVna } from '../../../lib/api'
import { countryFlag, truncateDid } from '../../../lib/flag'
import type { DidCardGroup, EcosystemStatsGroup, SearchHit } from '../../../lib/types'
import Logo from './Logo'

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

/** The bound DID's card identity from the TG-FCT-6b `didCard` group. */
function DidCardIdentity({ card }: { card: DidCardGroup }) {
  if (!card.service && !card.operator) return null
  const flag = card.operator?.countryCode ? countryFlag(card.operator.countryCode) : null
  return (
    <div className="mt-3 flex items-start gap-3">
      <Logo
        uri={card.service?.logoUri ?? card.operator?.logoUri ?? null}
        alt={`${card.service?.name ?? card.operator?.name ?? 'Service'} logo`}
        size="h-10 w-10"
        fallback={(card.service?.name ?? card.operator?.name ?? '?').charAt(0).toUpperCase()}
      />
      <div className="min-w-0">
        <h3 className="display text-lg truncate">{card.service?.name ?? card.operator?.name ?? ''}</h3>
        {card.operator?.name && (
          <p className="text-sm text-muted truncate">
            {flag && <span className="mr-1.5">{flag}</span>}
            Operated by {card.operator.name}
          </p>
        )}
      </div>
    </div>
  )
}

/** Deposit / slash trust signals, mono muted, slashes in red when non-zero. */
function TrustSignals({
  heading,
  deposit,
  slashedEvents,
  lastSlashedAtTime,
  slashedValue,
}: {
  heading: string | null
  deposit: string | null
  slashedEvents: number | null
  lastSlashedAtTime: string | null
  slashedValue: string | null
}) {
  if (deposit === null && slashedEvents === null) return null
  return (
    <div className="mt-3 border-t border-rule pt-2.5 font-mono text-xs text-muted">
      {heading && <p className="eyebrow !text-[0.62rem]">{heading}</p>}
      <p className="mt-1">
        deposit {formatVna(deposit) ?? 'n/a'}
        <span className="mx-1.5">·</span>
        <span className={(slashedEvents ?? 0) > 0 ? 'text-[#ef4444]' : ''}>slashes {slashedEvents ?? 'n/a'}</span>
      </p>
      {(slashedEvents ?? 0) > 0 && (
        <p className="mt-0.5 text-[#ef4444]">
          last slashed {lastSlashedAtTime ? lastSlashedAtTime.slice(0, 10) : 'n/a'}
          <span className="mx-1.5">·</span>
          slashed {formatVna(slashedValue) ?? 'n/a'}
        </p>
      )}
    </div>
  )
}

/** Snippet-only rows for the non-Did surfaces ([SRCH-RES-2]). */
export default function GenericRow({ hit }: { hit: SearchHit }) {
  const sn = hit.snippet as Record<string, unknown>
  const archived = sn.archived === true
  const did = s(sn.did) ?? s(sn.didId)
  const schema = (sn.schema ?? {}) as Record<string, unknown>
  const ecosystem = (sn.ecosystem ?? {}) as Record<string, unknown>
  const trust = (sn.trust ?? {}) as Record<string, unknown>
  const corporation = (sn.corporation ?? {}) as Record<string, unknown>
  const didCard = (sn.didCard ?? null) as DidCardGroup | null
  const stats = (sn.stats ?? null) as EcosystemStatsGroup | null
  const title = s(schema.title) ?? s(sn.title)
  const description = s(schema.description) ?? s(sn.description)
  const ecosystemId = n(ecosystem.id) ?? n(sn.ecosystemId)
  const policyAddress = s(trust.policyAddress) ?? s(sn.policyAddress)
  const deposit = s(trust.deposit) ?? s(sn.deposit)
  const slashedEvents = n(trust.slashedEvents) ?? n(sn.slashedEvents)
  const didTrusted = didCard ? didCard.trusted && !didCard.isTrustExpired : null

  return (
    <article className="card p-5">
      <div className="flex items-center justify-between">
        <span className="eyebrow">{EYEBROWS[hit.type] ?? hit.type}</span>
        <div className="flex gap-2">
          {archived && <span className="chip">Archived</span>}
          {n(sn.id) != null && <span className="chip">id {String(sn.id)}</span>}
          {didTrusted != null && (
            <span className={`chip ${didTrusted ? 'chip-verified' : ''}`} title="Trust status of the bound DID">
              {didTrusted ? 'Verified' : 'Untrusted'}
            </span>
          )}
        </div>
      </div>

      {didCard && <DidCardIdentity card={didCard} />}

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
          <TrustSignals
            heading={null}
            deposit={deposit}
            slashedEvents={slashedEvents}
            lastSlashedAtTime={s(trust.lastSlashedAtTime)}
            slashedValue={s(trust.slashedValue)}
          />
        </div>
      )}

      {hit.type === 'Ecosystem' && (
        <>
          {stats && (
            <p className="mt-3 font-mono text-xs text-muted">
              {Object.entries(stats.participants)
                .map(([role, count]) => `${count} ${role.toLowerCase()}`)
                .join(' · ')}
              {Object.keys(stats.participants).length > 0 && <span className="mx-1.5">·</span>}
              {stats.issuedCredentials} issued · {stats.verifiedCredentials} verified credentials
            </p>
          )}
          <TrustSignals
            heading={n(corporation.id) != null ? `Corporation #${corporation.id}` : null}
            deposit={s(corporation.deposit)}
            slashedEvents={n(corporation.slashedEvents)}
            lastSlashedAtTime={s(corporation.lastSlashedAtTime)}
            slashedValue={s(corporation.slashedValue)}
          />
        </>
      )}

      {did && (
        <p className="mt-2 font-mono text-xs text-muted" title={did}>
          {truncateDid(did)}
        </p>
      )}
    </article>
  )
}
