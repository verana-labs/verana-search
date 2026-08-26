"use client";

import { useEffect, useRef } from "react";
import type { AppConfig } from "../../lib/config";
import type { FilterValue, SearchHit } from "../../lib/types";
import type { QueryState } from "./SearchApp";
import DidRow from "./rows/DidRow";
import GenericRow from "./rows/GenericRow";

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
  config: AppConfig;
  query: QueryState;
  hits: SearchHit[];
  totalCount: number | null;
  cursor: string | null;
  loading: boolean;
  loadingMore: boolean;
  error: { code: string | null; message: string } | null;
  onLoadMore: () => void;
  onRetry: () => void;
  onSetFilter: (key: string, value: FilterValue | null) => void;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // [SRCH-SCROLL-2] IntersectionObserver-driven cursor paging.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onLoadMore();
      },
      { rootMargin: "400px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, cursor]);

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-muted">
          {error.code ? `${error.code}: ` : ""}
          {error.message}
        </p>
        <button type="button" className="btn btn-primary mt-4" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  if (loading && hits.length === 0) {
    return (
      <div className="space-y-3" aria-hidden>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="skeleton h-4 w-24 mb-3" />
            <div className="skeleton h-6 w-1/2 mb-2" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!loading && hits.length === 0 && totalCount === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="display text-lg">No results</p>
        <p className="mt-2 text-sm text-muted">
          {query.freeText.trim()
            ? `Nothing matches "${query.freeText.trim()}". Search matches whole words.`
            : "Nothing on this surface matches the current filters."}
        </p>
      </div>
    );
  }

  return (
    <div aria-live="polite">
      <ul role="list" className={`space-y-3 ${loading ? "opacity-60" : ""}`}>
        {hits.map((hit) => (
          <li key={`${hit.type}|${hit.id}`} data-row>
            {hit.type === "Did" ? (
              <DidRow config={config} hit={hit} onSetFilter={onSetFilter} />
            ) : (
              <GenericRow hit={hit} />
            )}
          </li>
        ))}
      </ul>

      {cursor !== null ? (
        <div ref={sentinelRef} className="py-6 text-center">
          {loadingMore && (
            <span className="eyebrow">Loading more...</span>
          )}
        </div>
      ) : (
        hits.length > 0 && (
          <p className="py-6 text-center eyebrow">
            {totalCount} result{totalCount === 1 ? "" : "s"}
          </p>
        )
      )}
    </div>
  );
}
