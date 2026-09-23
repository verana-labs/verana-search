'use client'

import { faCheck, faCopy } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import { buildDidCard, formatVna } from '../../../lib/api'
import { badgeList, MAX_BADGES } from '../../../lib/badges'
import type { AppConfig } from '../../../lib/config'
import { countryFlag, truncateDid } from '../../../lib/flag'
import type { DidCard, DidSnippet, FilterValue, SearchHit } from '../../../lib/types'

type CardState = { status: 'loading' } | { status: 'ready'; card: DidCard } | { status: 'failed' }

export function cardFromGroups(s: Partial<DidSnippet>): DidCard {
  const ecosystemIds = (s.ecosystems ?? []).map((e) => e.id)
  return {
    serviceName: s.service?.name ?? null,
    serviceType: s.service?.type ?? null,
    serviceDescription: s.service?.description ?? null,
    serviceLogoUri: s.service?.logoUri ?? null,
    operatorName: s.operator?.name ?? null,
    operatorLogoUri: s.operator?.logoUri ?? null,
    operatorCountryCode: s.operator?.countryCode ?? null,
    operatorRegistryId: s.operator?.registryId ?? null,
    operatorAddress: s.operator?.address ?? null,
    endpointTypes: (s.endpoints ?? []).map((e) => e.type),
    isCorporation: s.isCorporation ?? false,
    isEcosystem: s.isEcosystem ?? ecosystemIds.length > 0,
    ecosystemIds,
    corporationId: s.corporation?.id ?? null,
    corporationDeposit: s.corporation?.deposit ?? null,
    corporationSlashedEvents: s.corporation?.slashedEvents ?? null,
    corporationLastSlashedAtTime: s.corporation?.lastSlashedAtTime ?? null,
    corporationSlashedValue: s.corporation?.slashedValue ?? null,
  }
}

/** Builds the card from the snippet when it carries the card data ([SRCH-ENR-4]). */
function cardFromSnippet(hit: SearchHit): DidCard | null {
  const s = hit.snippet
  if (s.service !== undefined) return cardFromGroups(s)
  if (s.serviceName === undefined) return null // minimum snippet, the resolver fills the card
  return {
    serviceName: s.serviceName ?? null,
    serviceType: s.serviceType ?? null,
    serviceDescription: s.serviceDescription ?? null,
    serviceLogoUri: s.serviceLogoUri ?? null,
    operatorName: s.operatorName ?? null,
    operatorLogoUri: s.operatorLogoUri ?? null,
    operatorCountryCode: s.operatorCountryCode ?? null,
    operatorRegistryId: null, // never in the flat snippet; resolver-only
    operatorAddress: null,
    endpointTypes: (s.serviceEndpoints ?? []).map((e) => e.type),
    isCorporation: s.isCorporation ?? false,
    isEcosystem: (s.ecosystemIds ?? []).length > 0,
    ecosystemIds: s.ecosystemIds ?? [],
    corporationId: s.corporationId ?? null,
    corporationDeposit: s.corporationDeposit ?? null,
    corporationSlashedEvents: s.corporationSlashedEvents ?? null,
    corporationLastSlashedAtTime: s.corporationLastSlashedAtTime ?? null,
    corporationSlashedValue: s.corporationSlashedValue ?? null,
  }
}

function Logo({ uri, alt, size, fallback }: { uri: string | null; alt: string; size: string; fallback: string }) {
  const [broken, setBroken] = useState(false)
  if (!uri || broken) {
    return (
      <span
        aria-hidden
        className={`${size} shrink-0 rounded-lg bg-surface-2 border border-rule flex items-center justify-center display text-muted`}
      >
        {fallback}
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={uri}
      alt={alt}
      className={`${size} shrink-0 rounded-lg object-cover bg-surface-2`}
      onError={() => setBroken(true)}
    />
  )
}

export function TrustChip({ trusted }: { trusted: boolean }) {
  return <span className={`chip ${trusted ? 'chip-verified' : ''}`}>{trusted ? 'Verified' : 'Untrusted'}</span>
}

export function CopyDidButton({ did }: { did: string }) {
  const [copied, setCopied] = useState(false)

  function copyDid() {
    navigator.clipboard?.writeText(did).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button type="button" aria-label="Copy DID" className="text-muted hover:text-ink" onClick={copyDid}>
      <FontAwesomeIcon icon={copied ? faCheck : faCopy} className={`h-3.5 w-3.5 ${copied ? 'text-success-ink' : ''}`} />
    </button>
  )
}

export function ServiceIdentity({
  card,
  did,
  loading = false,
  failed = false,
}: {
  card: DidCard | null
  did: string
  loading?: boolean
  failed?: boolean
}) {
  return (
    <>
      <div className="mt-3 flex items-start gap-3">
        <Logo
          uri={card?.serviceLogoUri ?? null}
          alt={`${card?.serviceName ?? 'Service'} logo`}
          size="h-12 w-12"
          fallback={(card?.serviceName ?? did.slice(-1)).charAt(0).toUpperCase()}
        />
        <div className="min-w-0">
          {loading ? (
            <>
              <div className="skeleton h-5 w-44 mb-1.5" />
              <div className="skeleton h-3.5 w-24" />
            </>
          ) : (
            <>
              <h3 className="display text-lg truncate">{card?.serviceName ?? 'Unnamed service'}</h3>
              {card?.serviceType && <p className="font-mono text-xs text-muted mt-0.5">{card.serviceType}</p>}
            </>
          )}
        </div>
      </div>
      {failed ? (
        <p className="mt-2 text-sm text-muted">Details unavailable</p>
      ) : (
        card?.serviceDescription && <p className="mt-2 text-sm text-muted line-clamp-2">{card.serviceDescription}</p>
      )}
    </>
  )
}

export function OperatorZone({ card, loading = false }: { card: DidCard | null; loading?: boolean }) {
  const flag = card?.operatorCountryCode ? countryFlag(card.operatorCountryCode) : null

  return (
    <div className="md:border-l md:border-rule md:pl-5">
      <span className="eyebrow">Operated by</span>
      <div className="mt-3 flex items-start gap-3">
        <Logo
          uri={card?.operatorLogoUri ?? null}
          alt={`${card?.operatorName ?? 'Operator'} logo`}
          size="h-9 w-9"
          fallback={(card?.operatorName ?? '?').charAt(0).toUpperCase()}
        />
        <div className="min-w-0">
          {loading ? (
            <>
              <div className="skeleton h-4.5 w-32 mb-1.5" />
              <div className="skeleton h-3.5 w-40" />
            </>
          ) : (
            <>
              <p className="font-semibold truncate">
                {flag && <span className="mr-1.5">{flag}</span>}
                {card?.operatorName ?? 'Unknown operator'}
              </p>
              {card?.operatorRegistryId && (
                <p className="font-mono text-xs text-muted mt-0.5">{card.operatorRegistryId}</p>
              )}
              {card?.operatorAddress && <p className="mt-1 text-sm text-muted truncate">{card.operatorAddress}</p>}
            </>
          )}
        </div>
      </div>

      {/* Owner-Corporation trust signals ([SRCH-ENR-2a] / [SRCH-RES-1]) */}
      {card?.corporationId != null && (
        <div className="mt-3 border-t border-rule pt-2.5 font-mono text-xs text-muted">
          <p className="eyebrow !text-[0.62rem]">Corporation #{card.corporationId}</p>
          <p className="mt-1">
            deposit {formatVna(card.corporationDeposit) ?? 'n/a'}
            <span className="mx-1.5">·</span>
            <span className={(card.corporationSlashedEvents ?? 0) > 0 ? 'text-danger' : ''}>
              slashes {card.corporationSlashedEvents ?? 'n/a'}
            </span>
          </p>
          {(card.corporationSlashedEvents ?? 0) > 0 && (
            <p className="mt-0.5 text-danger">
              last slashed {card.corporationLastSlashedAtTime ? card.corporationLastSlashedAtTime.slice(0, 10) : 'n/a'}
              <span className="mx-1.5">·</span>
              slashed {formatVna(card.corporationSlashedValue) ?? 'n/a'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function openResolverJson(config: AppConfig, did: string): void {
  const w = window.open('', '_blank')
  fetch(`${config.resolverBaseUrl}/v4/verifiable-trust/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      did,
      ecsCredentials: true,
      services: true,
      presentations: true,
    }),
  })
    .then((r) => r.json())
    .then((json) => {
      w?.document.write(`<pre>${JSON.stringify(json, null, 2).replace(/</g, '&lt;')}</pre>`)
    })
}

export default function DidRow({
  config,
  hit,
  onSetFilter,
}: {
  config: AppConfig
  hit: SearchHit
  onSetFilter: (key: string, value: FilterValue | null) => void
}) {
  const did = hit.snippet.did
  const snippetCard = cardFromSnippet(hit)
  const [state, setState] = useState<CardState>(
    snippetCard ? { status: 'ready', card: snippetCard } : { status: 'loading' }
  )

  // [SRCH-ENR-2]: resolver enrichment when the snippet has no card fields.
  useEffect(() => {
    if (snippetCard) return
    let cancelled = false
    buildDidCard(config, did, hit.snippet.lastObservedAtTime)
      .then((card) => {
        if (!cancelled) setState({ status: 'ready', card })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'failed' })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [did, snippetCard, hit.snippet.lastObservedAtTime, config])

  const trusted = (hit.snippet.trusted ?? false) && !hit.snippet.isTrustExpired
  const card = state.status === 'ready' ? state.card : null
  const badges = card ? badgeList(card.endpointTypes) : []
  const shownBadges = badges.slice(0, MAX_BADGES)
  const overflow = badges.length - shownBadges.length

  return (
    <article
      className="card p-5 cursor-pointer"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('a, button') || window.getSelection()?.toString()) return
        openResolverJson(config, did)
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-5">
        {/* SERVICE zone */}
        <div>
          <div className="flex items-center justify-between">
            <span className="eyebrow">Service</span>
            <span className="flex items-center gap-1.5">
              {card?.isCorporation && <span className="chip chip-entity">Corporation</span>}
              {card?.isEcosystem && (
                <span
                  className="chip chip-entity"
                  title={
                    card.ecosystemIds.length > 0
                      ? `Controls ecosystem${card.ecosystemIds.length > 1 ? 's' : ''} ${card.ecosystemIds.join(', ')}`
                      : 'Controls one or more ecosystems'
                  }
                >
                  Ecosystem
                </span>
              )}
              <TrustChip trusted={trusted} />
            </span>
          </div>
          <ServiceIdentity
            card={card}
            did={did}
            loading={state.status === 'loading'}
            failed={state.status === 'failed'}
          />

          {shownBadges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {shownBadges.map((b) => (
                <button
                  key={b.label}
                  type="button"
                  className="chip chip-endpoint"
                  title={`Filter by endpoint type ${b.rawType}`}
                  onClick={() => onSetFilter('Did.serviceTypes', { containsAny: [b.rawType] })}
                >
                  {b.label}
                </button>
              ))}
              {overflow > 0 && (
                <span
                  className="chip chip-endpoint"
                  title={badges
                    .slice(MAX_BADGES)
                    .map((b) => b.label)
                    .join(', ')}
                >
                  +{overflow}
                </span>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className="font-mono text-xs text-muted hover:text-ink truncate"
              title={did}
              onClick={() => openResolverJson(config, did)}
            >
              {truncateDid(did)}
            </button>
            <CopyDidButton did={did} />
          </div>
        </div>

        <OperatorZone card={card} loading={state.status === 'loading'} />
      </div>
    </article>
  )
}
