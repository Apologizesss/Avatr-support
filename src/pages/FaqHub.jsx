import { useEffect, useState } from 'react'
import { getClient } from '../lib/supabase'
import { DataTable } from '../components/DataTable'

const TABS = [
  { value: 'general',        label: 'ทั่วไป' },
  { value: 'avatr_07',       label: 'AVATR 07' },
  { value: 'avatr_11',       label: 'AVATR 11' },
  { value: 'avatr_11_royal', label: 'AVATR 11 Royal' },
]

/**
 * FaqHub: tab-based view for the `faq` table.
 * Each tab pre-filters by the `scope` column. The DataTable below is a
 * normal one but seeded with `initialFilters` and reset on tab switch.
 */
export function FaqHub({ table }) {
  const [active, setActive] = useState('general')
  const [counts, setCounts] = useState({})

  useEffect(() => {
    let cancelled = false
    const supabase = getClient()
    ;(async () => {
      const next = {}
      for (const t of TABS) {
        const { count, error } = await supabase
          .from('faq')
          .select('*', { count: 'exact', head: true })
          .eq('scope', t.value)
        if (cancelled) return
        next[t.value] = error ? null : count ?? 0
      }
      if (!cancelled) setCounts(next)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const initialFilters = [
    { key: 'scope', kind: 'enum', value: [active] },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{table.label}</h1>
        <p className="text-sm text-brand-500 dark:text-brand-400 mt-0.5">
          {table.description} — เลือกแท็บเพื่อกรองตามขอบเขต
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 border-b border-brand-200 dark:border-brand-800">
        {TABS.map((t) => {
          const isActive = t.value === active
          const c = counts[t.value]
          return (
            <button
              key={t.value}
              onClick={() => setActive(t.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? 'border-brand-900 dark:border-brand-100 text-brand-900 dark:text-brand-100'
                  : 'border-transparent text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 hover:border-brand-300 dark:hover:border-brand-700'
              }`}
            >
              {t.label}
              {c != null && (
                <span
                  className={`ml-2 badge !text-[10px] !py-0 !px-1.5 ${
                    isActive
                      ? 'bg-brand-900 dark:bg-brand-100 text-white dark:text-brand-950'
                      : 'bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-400'
                  }`}
                >
                  {c}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <DataTable
        key={`faq-${active}`}
        table={{ ...table, customView: undefined, label: `FAQ · ${labelFor(active)}` }}
        initialFilters={initialFilters}
        defaultCreateValues={{ scope: active }}
      />
    </div>
  )
}

function labelFor(scope) {
  return TABS.find((t) => t.value === scope)?.label || scope
}
