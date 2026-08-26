"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faMagnifyingGlass,
  faSliders,
} from "@fortawesome/free-solid-svg-icons";
import type { FacetEntry, FilterValue, SearchSurface } from "../../lib/types";
import { GATE_SURFACES, SURFACE_LABELS } from "../../lib/filters";
import type { QueryState } from "./SearchApp";
import FilterPanel from "./FilterPanel";

const SURFACES = Object.keys(SURFACE_LABELS) as SearchSurface[];

export default function SearchForm({
  query,
  facets,
  activeFilterCount,
  onFreeTextChange,
  onQueryChange,
  onSetFilter,
}: {
  query: QueryState;
  facets: Record<string, FacetEntry[]>;
  activeFilterCount: number;
  onFreeTextChange: (text: string) => void;
  onQueryChange: (patch: Partial<QueryState>) => void;
  onSetFilter: (key: string, value: FilterValue | null) => void;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on load; refocus with "/" ([Accessibility] in spec.md).
  useEffect(() => {
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showUntrusted = GATE_SURFACES.includeUntrusted.includes(query.surface);
  const showArchived = GATE_SURFACES.includeArchived.includes(query.surface);

  return (
    <div>
      <div className="flex flex-wrap items-stretch gap-3">
        <select
          aria-label="Search surface"
          className="input font-medium"
          value={query.surface}
          onChange={(e) =>
            onQueryChange({ surface: e.target.value as SearchSurface })
          }
        >
          {SURFACES.map((s) => (
            <option key={s} value={s}>
              {SURFACE_LABELS[s]}
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-56">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none"
          />
          <input
            ref={inputRef}
            type="text"
            className="input w-full pl-10"
            placeholder="Search the Discovery layer and decentralized trust graph"
            value={query.freeText}
            onChange={(e) => onFreeTextChange(e.target.value)}
            aria-label="Free text search"
          />
        </div>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
        >
          <FontAwesomeIcon icon={faSliders} className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="chip !py-0.5 !px-2">{activeFilterCount}</span>
          )}
          <FontAwesomeIcon
            icon={filtersOpen ? faChevronUp : faChevronDown}
            className="h-3 w-3"
          />
        </button>
      </div>

      {filtersOpen && (
        <div className="card mt-3 p-4">
          <FilterPanel
            surface={query.surface}
            filters={query.filters}
            facets={facets}
            onSetFilter={onSetFilter}
          />
          {(showUntrusted || showArchived) && (
            <div className="mt-4 flex flex-wrap gap-5 border-t border-rule pt-4">
              {showUntrusted && (
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={query.includeUntrusted}
                    onChange={(e) =>
                      onQueryChange({ includeUntrusted: e.target.checked })
                    }
                  />
                  Include untrusted
                </label>
              )}
              {showArchived && (
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={query.includeArchived}
                    onChange={(e) =>
                      onQueryChange({ includeArchived: e.target.checked })
                    }
                  />
                  Include archived
                </label>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
