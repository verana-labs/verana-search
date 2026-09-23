'use client'

import { FILTERS, type FilterDef, selectedValues, toggleValue } from '../../lib/filters'
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
    case 'multiselect': {
      const selected = selectedValues(value)
      const options = [...(def.options ?? []), ...(facetValues ?? []).map((f) => f.value), ...selected].filter(
        (o, i, all) => all.findIndex((x) => String(x) === String(o)) === i
      )
      return (
        <div>
          {label}
          {options.length > 0 && (
            <div className="input max-h-32 overflow-y-auto p-2 space-y-1 text-sm">
              {options.map((o) => {
                const count = facetValues?.find((f) => String(f.value) === String(o))?.count
                return (
                  <label key={String(o)} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.some((s) => String(s) === String(o))}
                      onChange={() => onChange(toggleValue(def, value, o))}
                    />
                    <span className="min-w-0 truncate">{String(o)}</span>
                    {count != null && <span className="ml-auto font-mono text-xs text-muted">{count}</span>}
                  </label>
                )
              })}
            </div>
          )}
          {!def.options && (
            <input
              type="text"
              className={`input w-full text-sm ${options.length > 0 ? 'mt-2' : ''}`}
              placeholder="Add a value, press Enter"
              onKeyDown={(e) => {
                const v = e.currentTarget.value.trim()
                if (e.key !== 'Enter' || !v) return
                if (!selected.some((s) => String(s) === v)) onChange(toggleValue(def, value, v))
                e.currentTarget.value = ''
              }}
            />
          )}
        </div>
      )
    }
    case 'boolean':
      return (
        <label className="block">
          {label}
          <select
            className="input w-full text-sm"
            value={typeof value === 'boolean' ? String(value) : ''}
            onChange={(e) => onChange(e.target.value === '' ? null : e.target.value === 'true')}
          >
            <option value="">Any</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
      )
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
            placeholder={def.placeholder}
            onChange={(e) => onChange(e.target.value ? { prefix: e.target.value } : null)}
          />
        </label>
      )
    }
    case 'range':
    case 'dateRange': {
      const temporal = def.kind === 'dateRange'
      const current =
        value && typeof value === 'object' && 'range' in value
          ? ((value as { range?: { gte?: number | string; lte?: number | string } }).range ?? {})
          : {}
      const toWire = (input: string, end: boolean): number | string => {
        if (temporal) return `${input}T${end ? '23:59:59.999' : '00:00:00'}Z`
        return def.scale ? Math.round(Number(input) * def.scale) : Number(input)
      }
      const toInput = (wire: number | string | undefined): number | string => {
        if (wire === undefined) return ''
        if (temporal) return String(wire).slice(0, 10)
        return def.scale ? Number(wire) / def.scale : wire
      }
      const update = (gte: string, lte: string) => {
        const range: { gte?: number | string; lte?: number | string } = {}
        if (gte !== '') range.gte = toWire(gte, false)
        if (lte !== '') range.lte = toWire(lte, true)
        onChange(Object.keys(range).length > 0 ? { range } : null)
      }
      return (
        <div>
          {label}
          <div className={`flex gap-2 ${temporal ? 'flex-col' : ''}`}>
            <input
              type={temporal ? 'date' : 'number'}
              min={def.scale ? 0 : undefined}
              className="input w-full text-sm"
              placeholder="min"
              value={toInput(current.gte)}
              onChange={(e) => update(e.target.value, String(toInput(current.lte)))}
            />
            <input
              type={temporal ? 'date' : 'number'}
              min={def.scale ? 0 : undefined}
              className="input w-full text-sm"
              placeholder="max"
              value={toInput(current.lte)}
              onChange={(e) => update(String(toInput(current.gte)), e.target.value)}
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
            placeholder={def.placeholder}
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
      const listId = facetValues?.length ? `facet-${def.key}` : undefined
      return (
        <label className="block">
          {label}
          <input
            type="text"
            list={listId}
            className="input w-full text-sm"
            value={current}
            onChange={(e) => onChange(e.target.value || null)}
          />
          {listId && (
            <datalist id={listId}>
              {facetValues?.map((f) => (
                <option key={String(f.value)} value={String(f.value)} label={`${f.value} (${f.count})`} />
              ))}
            </datalist>
          )}
        </label>
      )
    }
  }
}
