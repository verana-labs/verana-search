'use client'

import { useEffect, useRef } from 'react'
import { ApiError } from '../../lib/api'
import type { AppConfig } from '../../lib/config'
import type { FilterValue, SearchHit, SearchSurface } from '../../lib/types'
import DidRow from './rows/DidRow'
import GenericRow from './rows/GenericRow'
import type { QueryState } from './SearchApp'

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_INPUT: 'The graph could not read this query. Check the search text and filters, then try again.',
  UNKNOWN_FILTER_FIELD: 'One of the filters is not supported on this surface. Clear the filters and try again.',
  INVALID_CURSOR: 'The result list went out of date while scrolling. Retry to load it again from the top.',
  UNKNOWN_ID: 'The requested record is not in the graph.',
  INTERNAL: 'The graph failed to answer this query. Try again in a moment.',
}

function errorMessage(error: Error): string {
  if (!(error instanceof ApiError)) return 'Could not reach the graph. Check your connection and try again.'
  if (!error.code) return `The graph returned an error (HTTP ${error.status}).`
  return ERROR_MESSAGES[error.code] ?? `${error.code}: ${error.message}`
}

function RowSkeleton({ surface }: { surface: SearchSurface }) {
  const didBound = surface !== 'CredentialSchema'
  return (
    <div className="card p-5">
      <div className={didBound ? 'grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-5' : undefined}>
        <div>
          <div className="skeleton h-3 w-24" />
          {didBound ? (
            <div className="mt-3 flex items-start gap-3">
              <div className="skeleton h-12 w-12 shrink-0" />
              <div>
                <div className="skeleton h-5 w-44 mb-1.5" />
                <div className="skeleton h-3.5 w-24" />
              </div>
            </div>
          ) : (
            <div className="skeleton mt-3 h-6 w-1/2" />
          )}
          <div className="skeleton mt-3 h-4 w-3/4" />
          {surface === 'Did' && (
            <div className="mt-3 flex gap-1.5">
              <div className="skeleton h-6 w-16 !rounded-full" />
              <div className="skeleton h-6 w-12 !rounded-full" />
              <div className="skeleton h-6 w-14 !rounded-full" />
            </div>
          )}
          {surface === 'ServiceEndpoint' && <div className="skeleton mt-3 h-6 w-20 !rounded-full" />}
          {surface !== 'Did' && <div className="skeleton mt-2 h-3.5 w-1/2" />}
          {didBound && <div className="skeleton mt-3 h-3.5 w-56" />}
        </div>
        {didBound && (
          <div className="md:border-l md:border-rule md:pl-5">
            <div className="skeleton h-3 w-24" />
            <div className="mt-3 flex items-start gap-3">
              <div className="skeleton h-9 w-9 shrink-0" />
              <div>
                <div className="skeleton h-4.5 w-32 mb-1.5" />
                <div className="skeleton h-3.5 w-40" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResultList({
  config,
  query,
  hits,
  totalCount,
  cursor,
  loading,
  loadingMore,
  error,
  onLoadMore,
  onRetry,
  onSetFilter,
}: {
  config: AppConfig
  query: QueryState
  hits: SearchHit[]
  totalCount: number | null
  cursor: string | null
  loading: boolean
  loadingMore: boolean
  error: Error | null
  onLoadMore: () => void
  onRetry: () => void
  onSetFilter: (key: string, value: FilterValue | null) => void
}) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  // [SRCH-SCROLL-2] IntersectionObserver-driven cursor paging.
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onLoadMore()
      },
      { rootMargin: '400px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [onLoadMore])

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-muted">{errorMessage(error)}</p>
        <button type="button" className="btn btn-primary mt-4" onClick={onRetry}>
          Retry
        </button>
      </div>
    )
  }

  if (loading && hits.length === 0) {
    return (
      <div className="space-y-3" aria-hidden>
        {Array.from({ length: 4 }).map((_, i) => (
          <RowSkeleton key={i} surface={query.surface} />
        ))}
      </div>
    )
  }

  if (!loading && hits.length === 0 && totalCount === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="display text-lg">No results</p>
        <p className="mt-2 text-sm text-muted">
          {query.freeText.trim()
            ? `Nothing matches "${query.freeText.trim()}". Search matches whole words.`
            : 'Nothing on this surface matches the current filters.'}
        </p>
      </div>
    )
  }

  return (
    <div aria-live="polite">
      <ul className={`space-y-3 ${loading ? 'opacity-60' : ''}`}>
        {hits.map((hit) => (
          <li key={`${hit.type}|${hit.id}`} data-row>
            {hit.type === 'Did' ? (
              <DidRow config={config} hit={hit} onSetFilter={onSetFilter} />
            ) : (
              <GenericRow hit={hit} />
            )}
          </li>
        ))}
      </ul>

      {cursor !== null ? (
        <div ref={sentinelRef} className="py-6 text-center">
          {loadingMore && <span className="eyebrow">Loading more...</span>}
        </div>
      ) : (
        !loading &&
        hits.length > 0 && (
          <p className="py-6 text-center eyebrow">
            {totalCount} result{totalCount === 1 ? '' : 's'}
          </p>
        )
      )}
    </div>
  )
}
