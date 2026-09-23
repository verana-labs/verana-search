'use client'

import { FILTERS, selectedValues, toggleValue } from '../../lib/filters'
import type { FacetEntry, FilterValue, SearchSurface } from '../../lib/types'

export default function FacetBar({
  surface,
  facets,
  filters,
  onSetFilter,
}: {
  surface: SearchSurface
  facets: Record<string, FacetEntry[]>
  filters: Record<string, FilterValue>
  onSetFilter: (key: string, value: FilterValue | null) => void
}) {
  const groups = FILTERS[surface].filter((def) => (facets[def.key] ?? []).length > 0)
  if (groups.length === 0) return null

  return (
    <div className="mt-4 hidden md:flex flex-wrap gap-x-6 gap-y-2">
      {groups.map((def) => {
        const selected = selectedValues(filters[def.key])
        return (
          <div key={def.key} className="flex flex-wrap items-center gap-2">
            <span className="eyebrow !text-[0.62rem]">{def.label}</span>
            {facets[def.key].map((f) => {
              const active = selected.some((s) => String(s) === String(f.value))
              return (
                <button
                  key={String(f.value)}
                  type="button"
                  className={`chip chip-endpoint ${active ? '!border-primary !text-ink' : ''}`}
                  aria-pressed={active}
                  onClick={() => onSetFilter(def.key, toggleValue(def, filters[def.key], f.value))}
                >
                  {typeof f.value === 'boolean' ? (f.value ? 'Yes' : 'No') : String(f.value)}{' '}
                  <span className="opacity-70">{f.count}</span>
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
