"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AppConfig } from "../../lib/config";
import type {
  FacetEntry,
  FilterValue,
  SearchHit,
  SearchRequest,
  SearchSurface,
} from "../../lib/types";
import { ApiError, searchGraph } from "../../lib/api";
import SearchForm from "./SearchForm";
import ResultList from "./ResultList";

const DEBOUNCE_MS = 250; // [SRCH-FORM-2]
const OVERSCAN = 4; // [SRCH-SCROLL-1]
const LIMIT_MIN = 6;
const LIMIT_MAX = 50;
const ROW_HEIGHT_ESTIMATE: Record<string, number> = {
  Did: 180,
  Ecosystem: 96,
  Corporation: 96,
  CredentialSchema: 110,
  ServiceEndpoint: 96,
};

export type QueryState = {
  surface: SearchSurface;
  freeText: string;
  filters: Record<string, FilterValue>;
  includeUntrusted: boolean;
  includeArchived: boolean;
};

const INITIAL_QUERY: QueryState = {
  surface: "Did",
  freeText: "",
  filters: {},
  includeUntrusted: false,
  includeArchived: false,
};

export default function SearchApp({ config }: { config: AppConfig }) {
  const [query, setQuery] = useState<QueryState>(INITIAL_QUERY);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [facets, setFacets] = useState<Record<string, FacetEntry[]>>({});
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<{ code: string | null; message: string } | null>(null);

  const resultZoneRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationRef = useRef(0);
  const seenRef = useRef<Set<string>>(new Set());
  // Serialize page loads: SCROLL-2 requires at most one page request in flight.
  const pageInFlightRef = useRef(false);

  /** [SRCH-SCROLL-1] viewport-sized limit. */
  const computeLimit = useCallback((surface: SearchSurface): number => {
    const zoneTop =
      resultZoneRef.current?.getBoundingClientRect().top ?? 260;
    const available = Math.max(window.innerHeight - zoneTop, 200);
    const firstRow = resultZoneRef.current?.querySelector("[data-row]");
    const rowHeight =
      (firstRow instanceof HTMLElement && firstRow.offsetHeight > 40
        ? firstRow.offsetHeight
        : null) ?? ROW_HEIGHT_ESTIMATE[surface];
    return Math.min(
      Math.max(Math.ceil(available / rowHeight) + OVERSCAN, LIMIT_MIN),
      LIMIT_MAX,
    );
  }, []);

  const buildRequest = useCallback(
    (q: QueryState, pageCursor: string | null): SearchRequest => {
      const req: SearchRequest = {
        surface: q.surface,
        limit: computeLimit(q.surface),
      };
      const text = q.freeText.trim();
      if (text) req.freeText = text;
      if (Object.keys(q.filters).length > 0) req.filters = q.filters;
      if (pageCursor) req.cursor = pageCursor;
      if (q.includeUntrusted) req.includeUntrusted = true;
      if (q.includeArchived) req.includeArchived = true;
      return req;
    },
    [computeLimit],
  );

  /** Runs a first-page query, replacing the list when the response lands. */
  const runQuery = useCallback(
    (q: QueryState) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const generation = ++generationRef.current;
      setLoading(true);
      setError(null);

      searchGraph(config, buildRequest(q, null), controller.signal)
        .then((res) => {
          if (generation !== generationRef.current) return; // superseded
          const seen = new Set<string>();
          const deduped = res.hits.filter((h) => {
            const key = `${h.type}|${h.id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          seenRef.current = seen;
          setHits(deduped);
          setFacets(res.facets ?? {});
          setTotalCount(res.totalCount);
          setCursor(res.cursor);
          setLoading(false);
        })
        .catch((e: unknown) => {
          if (controller.signal.aborted) return;
          if (generation !== generationRef.current) return;
          const err = e as ApiError;
          setError({
            code: err instanceof ApiError ? err.code : null,
            message: err.message ?? "Request failed",
          });
          setLoading(false);
        });
    },
    [config, buildRequest],
  );

  /** [SRCH-SCROLL-2] next page via cursor. */
  const loadMore = useCallback(() => {
    if (!cursor || pageInFlightRef.current) return;
    pageInFlightRef.current = true;
    const generation = generationRef.current;
    setLoadingMore(true);

    searchGraph(config, buildRequest(query, cursor))
      .then((res) => {
        if (generation !== generationRef.current) return; // superseded
        const fresh = res.hits.filter((h) => {
          const key = `${h.type}|${h.id}`;
          if (seenRef.current.has(key)) return false;
          seenRef.current.add(key);
          return true;
        });
        setHits((prev) => [...prev, ...fresh]);
        setTotalCount(res.totalCount);
        setCursor(res.cursor);
      })
      .catch((e: unknown) => {
        if (generation !== generationRef.current) return;
        if (e instanceof ApiError && e.code === "INVALID_CURSOR") {
          // [SRCH-SCROLL-2]: restart from the first page, keeping rendered
          // rows until the fresh first page lands.
          runQuery(query);
        } else {
          setError({
            code: e instanceof ApiError ? e.code : null,
            message: (e as Error).message ?? "Request failed",
          });
        }
      })
      .finally(() => {
        pageInFlightRef.current = false;
        setLoadingMore(false);
      });
  }, [config, buildRequest, cursor, query, runQuery]);

  /** Form change entry points ([SRCH-FORM-2]). */
  const onFreeTextChange = useCallback(
    (freeText: string) => {
      setQuery((prev) => {
        const next = { ...prev, freeText };
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => runQuery(next), DEBOUNCE_MS);
        return next;
      });
    },
    [runQuery],
  );

  const onQueryChange = useCallback(
    (patch: Partial<QueryState>) => {
      setQuery((prev) => {
        const next = { ...prev, ...patch };
        if (patch.surface && patch.surface !== prev.surface) {
          // Surface switch clears filters that do not exist there.
          next.filters = {};
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        runQuery(next); // immediate, no debounce
        return next;
      });
    },
    [runQuery],
  );

  // Initial query on mount.
  useEffect(() => {
    runQuery(INITIAL_QUERY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Convenience: a badge or facet click sets a filter.
  const setFilter = useCallback(
    (key: string, value: FilterValue | null) => {
      setQuery((prev) => {
        const filters = { ...prev.filters };
        if (value === null) delete filters[key];
        else filters[key] = value;
        const next = { ...prev, filters };
        runQuery(next);
        return next;
      });
    },
    [runQuery],
  );

  const activeFilterCount = useMemo(
    () => Object.keys(query.filters).length,
    [query.filters],
  );

  return (
    <div className="py-6">
      <SearchForm
        query={query}
        facets={facets}
        activeFilterCount={activeFilterCount}
        onFreeTextChange={onFreeTextChange}
        onQueryChange={onQueryChange}
        onSetFilter={setFilter}
      />
      <div ref={resultZoneRef} className="mt-6">
        <ResultList
          config={config}
          query={query}
          hits={hits}
          totalCount={totalCount}
          cursor={cursor}
          loading={loading}
          loadingMore={loadingMore}
          error={error}
          onLoadMore={loadMore}
          onRetry={() => runQuery(query)}
          onSetFilter={setFilter}
        />
      </div>
    </div>
  );
}
