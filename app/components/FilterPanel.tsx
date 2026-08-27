'use client'

import { FILTERS, type FilterDef } from '../../lib/filters'
import type { FacetEntry, FilterValue, SearchSurface } from '../../lib/types'

/**
 * Data-driven filter panel ([SRCH-FORM-3]): renders the [TG-FCT-3] filter set
 * of the selected surface. Selects merge options from the previous response's
 * facets aggregations when available.
 */
export default function FilterPanel({
  surface,
  filters,
  facets,
  onSetFilter,
}: {
  surface: SearchSurface
  filters: Record<string, FilterValue>
  facets: Record<string, FacetEntry[]>
  onSetFilter: (key: string, value: FilterValue | null) => void
}) {
  const defs = FILTERS[surface]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {defs.map((def) => (
        <Field
          key={def.key}
          def={def}
          value={filters[def.key]}
          facetValues={facets[def.key]}
          onChange={(v) => onSetFilter(def.key, v)}
        />
      ))}
    </div>
  )
}

function Field({
  def,
  value,
  facetValues,
  onChange,
}: {
  def: FilterDef
  value: FilterValue | undefined
  facetValues: FacetEntry[] | undefined
  onChange: (v: FilterValue | null) => void
}) {
  const label = <span className="eyebrow block mb-1 !text-[0.62rem]">{def.label}</span>

  switch (def.kind) {
    case 'select': {
      const options = def.options ?? (facetValues ?? []).map((f) => String(f.value))
      return (
        <label className="block">
          {label}
          <select
            className="input w-full text-sm"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value || null)}
          >
            <option value="">Any</option>
            {options.map((o) => {
              const count = facetValues?.find((f) => String(f.value) === o)?.count
              return (
                <option key={o} value={o}>
                  {o}
                  {count != null ? ` (${count})` : ''}
                </option>
              )
            })}
          </select>
        </label>
      )
    }
    case 'prefix': {
      const current =
        value && typeof value === 'object' && 'prefix' in value ? ((value as { prefix?: string }).prefix ?? '') : ''
      return (
        <label className="block">
          {label}
          <input
            type="text"
            className="input w-full text-sm"
            value={current}
            placeholder="e.g. CO-DC"
            onChange={(e) => onChange(e.target.value ? { prefix: e.target.value } : null)}
          />
        </label>
      )
    }
    case 'range': {
      const current =
        value && typeof value === 'object' && 'range' in value
          ? ((value as { range?: { gte?: number; lte?: number } }).range ?? {})
          : {}
      const update = (gte: string, lte: string) => {
        const range: { gte?: number; lte?: number } = {}
        if (gte !== '') range.gte = Number(gte)
        if (lte !== '') range.lte = Number(lte)
        onChange(Object.keys(range).length > 0 ? { range } : null)
      }
      return (
        <div>
          {label}
          <div className="flex gap-2">
            <input
              type="number"
              className="input w-full text-sm"
              placeholder="min"
              value={current.gte ?? ''}
              onChange={(e) => update(e.target.value, String(current.lte ?? ''))}
            />
            <input
              type="number"
              className="input w-full text-sm"
              placeholder="max"
              value={current.lte ?? ''}
              onChange={(e) => update(String(current.gte ?? ''), e.target.value)}
            />
          </div>
        </div>
      )
    }
    case 'tags': {
      const current =
        value && typeof value === 'object' && 'containsAny' in value
          ? ((value as { containsAny?: string[] }).containsAny ?? []).join(', ')
          : ''
      return (
        <label className="block">
          {label}
          <input
            type="text"
            className="input w-full text-sm"
            value={current}
            placeholder="e.g. MCP, DIDCommMessaging"
            onChange={(e) => {
              const tags = e.target.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
              onChange(tags.length > 0 ? { containsAny: tags } : null)
            }}
          />
        </label>
      )
    }
    default: {
      const current = typeof value === 'string' || typeof value === 'number' ? String(value) : ''
      return (
        <label className="block">
          {label}
          <input
            type="text"
            className="input w-full text-sm"
            value={current}
            onChange={(e) => onChange(e.target.value || null)}
          />
        </label>
      )
    }
  }
}
