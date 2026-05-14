import { Fragment, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  Plus,
  Search,
  RefreshCw,
  Download,
  Pencil,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Filter,
  Settings2,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Info,
  X,
} from 'lucide-react'
import { getClient } from '../lib/supabase'
import {
  inferSchema,
  inferRequired,
  formatCell,
  toCSV,
  downloadCSV,
  applyClientFilters,
  sortRows,
} from '../lib/utils'
import {
  columnLabel,
  getColumnMeta,
  groupedColumns,
  filterableColumns,
  defaultVisibleColumnKeys,
  primaryDisplayKey,
} from '../lib/tables'
import { friendlyError } from '../lib/errors'
import { logAudit } from '../lib/audit'
import { CenteredSpinner, Spinner } from './Spinner'
import { Modal } from './Modal'
import { RowEditor } from './RowEditor'
import { ConfirmDialog } from './ConfirmDialog'
import { toast } from './Toast'
import { ImageGalleryCell } from './ImageGalleryField'

const PAGE_SIZE = 25
const LS_PREFIX = 'avatr.columns.'
const LS_GROUP_PREFIX = 'avatr.groupCollapse.'

// -----------------------------------------------------------------------
// Helper: read / write visible-columns from localStorage
// -----------------------------------------------------------------------
function readVisibleKeys(tableId) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + tableId)
    if (raw) return new Set(JSON.parse(raw))
  } catch {
    // ignore
  }
  return null
}

function writeVisibleKeys(tableId, keysSet) {
  try {
    localStorage.setItem(LS_PREFIX + tableId, JSON.stringify([...keysSet]))
  } catch {
    // ignore
  }
}

function readCollapsedGroups(tableId) {
  try {
    const raw = localStorage.getItem(LS_GROUP_PREFIX + tableId)
    if (raw) return new Set(JSON.parse(raw))
  } catch {
    // ignore
  }
  return new Set()
}

function writeCollapsedGroups(tableId, keysSet) {
  try {
    localStorage.setItem(LS_GROUP_PREFIX + tableId, JSON.stringify([...keysSet]))
  } catch {
    // ignore
  }
}

// -----------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------

function IconButton({ onClick, title, icon: Icon, danger = false }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2.5 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
        danger
          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
          : 'text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-800'
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}

function CellValue({ value, type }) {
  if (type === 'image_gallery') {
    return <ImageGalleryCell value={value} />
  }
  if (value === null || value === undefined) {
    return <span className="text-brand-400 italic text-xs">—</span>
  }
  if (type === 'boolean') {
    return (
      <span
        className={`badge ${
          value
            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
            : 'bg-brand-100 text-brand-700 dark:bg-brand-800 dark:text-brand-300'
        }`}
      >
        {value ? '✓ ใช่' : '✗ ไม่'}
      </span>
    )
  }
  if (type === 'json') {
    return (
      <code className="text-xs font-mono text-brand-600 dark:text-brand-400">
        {JSON.stringify(value)}
      </code>
    )
  }
  if (type === 'uuid') {
    return (
      <code className="text-xs font-mono text-brand-500">
        {String(value).slice(0, 8)}…
      </code>
    )
  }
  return <span>{formatCell(value, type)}</span>
}

// Minimal Tailwind group-hover tooltip
function InfoTooltip({ description }) {
  if (!description) return null
  return (
    <span className="relative group/tooltip inline-flex items-center ml-1 align-middle">
      <Info
        className="w-3.5 h-3.5 text-brand-400 dark:text-brand-500 cursor-help"
        title={description}
      />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-[200px] rounded bg-brand-800 dark:bg-brand-700 px-2 py-1 text-xs text-white opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 whitespace-normal shadow-lg">
        {description}
      </span>
    </span>
  )
}

// Sort icon for a column header
function SortIcon({ dir }) {
  if (dir === 'asc') return <ChevronUp className="w-3.5 h-3.5 inline-block ml-0.5 text-brand-600 dark:text-brand-300" />
  if (dir === 'desc') return <ChevronDown className="w-3.5 h-3.5 inline-block ml-0.5 text-brand-600 dark:text-brand-300" />
  return <ChevronsUpDown className="w-3.5 h-3.5 inline-block ml-0.5 text-brand-400 dark:text-brand-500" />
}

// -----------------------------------------------------------------------
// FilterPanel — one control per filterable column
// -----------------------------------------------------------------------
function FilterPanel({ filterDefs, filters, setFilters, rows, onClose }) {
  // Local state mirrors filters (by key → value)
  const getVal = (key) => {
    const f = filters.find((f) => f.key === key)
    return f ? f.value : null
  }

  const setVal = (key, kind, value) => {
    setFilters((prev) => {
      const next = prev.filter((f) => f.key !== key)
      if (value === null || value === undefined) return next
      if (kind === 'enum' && Array.isArray(value) && value.length === 0) return next
      if (kind === 'range') {
        const { min, max } = value || {}
        const empty = (min === '' || min === null || min === undefined) && (max === '' || max === null || max === undefined)
        if (empty) return next
      }
      if (kind === 'dateRange') {
        const { from, to } = value || {}
        if (!from && !to) return next
      }
      return [...next, { key, kind, value }]
    })
  }

  return (
    <div className="absolute top-full left-0 mt-1 z-40 w-80 sm:w-96 card shadow-xl border border-brand-200 dark:border-brand-700 p-4 space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">กรองข้อมูล</span>
        <button className="btn btn-ghost !p-1" onClick={onClose} title="ปิด">
          <X className="w-4 h-4" />
        </button>
      </div>

      {filterDefs.map((def) => {
        const val = getVal(def.key)

        if (def.kind === 'enum') {
          // Auto-derive distinct values if no enumOptions
          const opts = def.enumOptions
            ? def.enumOptions
            : [...new Set(rows.map((r) => r[def.key]).filter((v) => v !== null && v !== undefined))].map(String)
          const selected = Array.isArray(val) ? val : []
          return (
            <div key={def.key} className="space-y-1">
              <div className="text-xs font-medium text-brand-600 dark:text-brand-400">{def.label}</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {opts.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-brand-600"
                      checked={selected.includes(opt)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...selected, opt]
                          : selected.filter((s) => s !== opt)
                        setVal(def.key, 'enum', next)
                      }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          )
        }

        if (def.kind === 'range') {
          const rangeVal = val || {}
          const minPh = def.min !== null ? `min: ${def.min}${def.unit ? ' ' + def.unit : ''}` : 'ต่ำสุด'
          const maxPh = def.max !== null ? `max: ${def.max}${def.unit ? ' ' + def.unit : ''}` : 'สูงสุด'
          return (
            <div key={def.key} className="space-y-1">
              <div className="text-xs font-medium text-brand-600 dark:text-brand-400">
                {def.label}{def.unit ? ` (${def.unit})` : ''}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="input flex-1"
                  placeholder={minPh}
                  step={def.step ?? undefined}
                  value={rangeVal.min ?? ''}
                  onChange={(e) => setVal(def.key, 'range', { ...rangeVal, min: e.target.value })}
                />
                <input
                  type="number"
                  className="input flex-1"
                  placeholder={maxPh}
                  step={def.step ?? undefined}
                  value={rangeVal.max ?? ''}
                  onChange={(e) => setVal(def.key, 'range', { ...rangeVal, max: e.target.value })}
                />
              </div>
            </div>
          )
        }

        if (def.kind === 'dateRange') {
          const drVal = val || {}
          return (
            <div key={def.key} className="space-y-1">
              <div className="text-xs font-medium text-brand-600 dark:text-brand-400">{def.label}</div>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="input flex-1"
                  value={drVal.from ?? ''}
                  onChange={(e) => setVal(def.key, 'dateRange', { ...drVal, from: e.target.value })}
                />
                <input
                  type="date"
                  className="input flex-1"
                  value={drVal.to ?? ''}
                  onChange={(e) => setVal(def.key, 'dateRange', { ...drVal, to: e.target.value })}
                />
              </div>
            </div>
          )
        }

        if (def.kind === 'boolean') {
          // Three pills: ใช่ / ไม่ใช่ / ทั้งหมด
          const pills = [
            { label: 'ใช่', value: true },
            { label: 'ไม่ใช่', value: false },
            { label: 'ทั้งหมด', value: null },
          ]
          return (
            <div key={def.key} className="space-y-1">
              <div className="text-xs font-medium text-brand-600 dark:text-brand-400">{def.label}</div>
              <div className="flex gap-2">
                {pills.map((p) => (
                  <button
                    key={String(p.value)}
                    className={`btn !text-xs !py-1 !px-3 ${val === p.value ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setVal(def.key, 'boolean', p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )
        }

        if (def.kind === 'text') {
          return (
            <div key={def.key} className="space-y-1">
              <div className="text-xs font-medium text-brand-600 dark:text-brand-400">{def.label}</div>
              <input
                type="text"
                className="input w-full"
                placeholder="ค้นหา..."
                value={val ?? ''}
                onChange={(e) => setVal(def.key, 'text', e.target.value || null)}
              />
            </div>
          )
        }

        return null
      })}

      {filters.length > 0 && (
        <button
          className="btn btn-ghost !text-xs w-full"
          onClick={() => setFilters([])}
        >
          ล้างตัวกรองทั้งหมด
        </button>
      )}
    </div>
  )
}

// -----------------------------------------------------------------------
// ColumnsMenu — group checkboxes per fieldGroup
// -----------------------------------------------------------------------
function ColumnsMenu({ groups, visibleKeys, setVisibleKeys, onClose }) {
  return (
    <div className="absolute top-full right-0 mt-1 z-40 w-72 card shadow-xl border border-brand-200 dark:border-brand-700 p-4 space-y-3 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">คอลัมน์</span>
        <button className="btn btn-ghost !p-1" onClick={onClose} title="ปิด">
          <X className="w-4 h-4" />
        </button>
      </div>

      {groups.map((g) => (
        <div key={g.key} className="space-y-1">
          <div className="text-xs font-medium text-brand-500 dark:text-brand-400 uppercase tracking-wide">
            {g.label}
          </div>
          {g.columns.map((col) => {
            const isVisible = visibleKeys.has(col.key)
            // Don't allow hiding the last visible column
            const isLast = visibleKeys.size === 1 && isVisible
            return (
              <label
                key={col.key}
                className={`flex items-center gap-2 text-sm cursor-pointer ${isLast ? 'opacity-50' : ''}`}
              >
                <input
                  type="checkbox"
                  className="accent-brand-600"
                  checked={isVisible}
                  disabled={isLast}
                  onChange={(e) => {
                    const next = new Set(visibleKeys)
                    if (e.target.checked) next.add(col.key)
                    else next.delete(col.key)
                    setVisibleKeys(next)
                  }}
                />
                {columnLabel({ columnLabels: undefined }, col.key)}
              </label>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// -----------------------------------------------------------------------
// Main DataTable
// -----------------------------------------------------------------------
export function DataTable({ table, initialFilters, defaultCreateValues }) {
  const tableId = table.id
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  // Sort: { key, dir: 'asc'|'desc' } | null
  const [sort, setSort] = useState(null)
  // Filters: [{ key, kind, value }] — seeded by caller if provided
  const [filters, setFilters] = useState(() =>
    Array.isArray(initialFilters) ? initialFilters : []
  )

  // Popovers
  const [filterOpen, setFilterOpen] = useState(false)
  const [columnsOpen, setColumnsOpen] = useState(false)
  const filterRef = useRef(null)
  const columnsRef = useRef(null)

  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [exitConfirm, setExitConfirm] = useState(false)

  // Collapsed group keys for group-by mode (persisted per table)
  const [collapsedGroups, setCollapsedGroups] = useState(() => readCollapsedGroups(tableId))

  const editorRef = useRef(null)

  const columns = useMemo(() => inferSchema(rows), [rows])
  const requiredColumns = useMemo(() => inferRequired(rows), [rows])

  // Grouped columns (used for header & columns menu)
  const colGroups = useMemo(() => groupedColumns(table, columns), [table, columns])

  // Flat all columns with meta (for rendering the 2-row header)
  const allColumnsWithMeta = useMemo(
    () => colGroups.flatMap((g) => g.columns),
    [colGroups]
  )

  // Filterable column definitions
  const filterDefs = useMemo(() => filterableColumns(table, columns), [table, columns])

  // Primary display key
  const primaryKey = useMemo(() => primaryDisplayKey(table, columns), [table, columns])

  // Column visibility
  const [visibleKeys, setVisibleKeys] = useState(() => {
    const stored = readVisibleKeys(tableId)
    if (stored) return stored
    // defaultVisibleColumnKeys needs columns, but on first render columns is []
    // We'll set a sentinel of null meaning "use defaults when columns arrive"
    return null
  })

  // Once columns are inferred, resolve defaults if not yet stored
  useEffect(() => {
    if (columns.length === 0) return
    if (visibleKeys !== null) return
    const stored = readVisibleKeys(tableId)
    if (stored) {
      setVisibleKeys(stored)
    } else {
      setVisibleKeys(defaultVisibleColumnKeys(table, columns))
    }
  }, [columns, tableId, table, visibleKeys])

  // Persist visibility changes
  useEffect(() => {
    if (visibleKeys) writeVisibleKeys(tableId, visibleKeys)
  }, [visibleKeys, tableId])

  // Persist collapsed groups
  useEffect(() => {
    writeCollapsedGroups(tableId, collapsedGroups)
  }, [collapsedGroups, tableId])

  // On tableId change: reset filters/sort/search/page but NOT column visibility
  useEffect(() => {
    setPage(0)
    setSearch('')
    setFilters(Array.isArray(initialFilters) ? initialFilters : [])
    setSort(null)
    // Reset visibility to null so it re-derives from defaults/localStorage for new table
    setVisibleKeys(() => {
      const stored = readVisibleKeys(tableId)
      return stored ?? null
    })
    setCollapsedGroups(readCollapsedGroups(tableId))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId])

  // Close popovers on outside click
  useEffect(() => {
    function handler(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
      if (columnsRef.current && !columnsRef.current.contains(e.target)) setColumnsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Columns visible in the table (in group order)
  const visibleColumnsOrdered = useMemo(() => {
    if (!visibleKeys) return allColumnsWithMeta
    return allColumnsWithMeta.filter((c) => visibleKeys.has(c.key))
  }, [allColumnsWithMeta, visibleKeys])

  // Groups restricted to visible columns (for the 2-row header)
  const visibleGroups = useMemo(() => {
    const vSet = visibleKeys ?? new Set(allColumnsWithMeta.map((c) => c.key))
    return colGroups
      .map((g) => ({ ...g, columns: g.columns.filter((c) => vSet.has(c.key)) }))
      .filter((g) => g.columns.length > 0)
  }, [colGroups, visibleKeys, allColumnsWithMeta])

  const load = useCallback(
    async (opts = {}) => {
      setLoading(true)
      setError(null)
      try {
        const supabase = getClient()
        const from = (opts.page ?? page) * PAGE_SIZE
        const to = from + PAGE_SIZE - 1

        const orderCandidates = ['created_at', 'updated_at', 'id']
        let data = null
        let count = 0
        let lastError = null

        for (const orderCol of orderCandidates) {
          const result = await supabase
            .from(tableId)
            .select('*', { count: 'exact' })
            .order(orderCol, { ascending: false })
            .range(from, to)

          if (!result.error) {
            data = result.data
            count = result.count
            lastError = null
            break
          }
          lastError = result.error
          if (!/does not exist|column.*not found/i.test(result.error.message)) {
            break
          }
        }

        if (lastError) {
          const { data: d, error: e, count: c } = await supabase
            .from(tableId)
            .select('*', { count: 'exact' })
            .range(from, to)
          if (e) throw e
          data = d
          count = c
        }

        setRows(data || [])
        setTotalCount(count || 0)
      } catch (e) {
        console.error(e)
        setError(friendlyError(e))
        setRows([])
      } finally {
        setLoading(false)
      }
    },
    [tableId, page]
  )

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId, page])

  // Apply search → filters → sort (all client-side on current page rows)
  const filteredRows = useMemo(() => {
    let result = rows

    // 1. Text search (global)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((row) =>
        Object.values(row).some((v) => {
          if (v === null || v === undefined) return false
          if (typeof v === 'object') return JSON.stringify(v).toLowerCase().includes(q)
          return String(v).toLowerCase().includes(q)
        })
      )
    }

    // 2. Structured filters
    result = applyClientFilters(result, filters)

    // 3. Sort
    if (sort?.key && sort?.dir) {
      const col = allColumnsWithMeta.find((c) => c.key === sort.key)
      const effectiveType = (col?.meta?.type || col?.type) ?? 'text'
      result = sortRows(result, sort.key, sort.dir, effectiveType)
    }

    return result
  }, [rows, search, filters, sort, allColumnsWithMeta])

  // Group rows by table.groupByField (optional). Returns null if no grouping.
  const groupedRows = useMemo(() => {
    if (!table.groupByField) return null
    const groupKeyCol = table.groupByField
    const buckets = new Map()
    for (const row of filteredRows) {
      const raw = row?.[groupKeyCol]
      const key =
        raw === null || raw === undefined || raw === '' ? '__ungrouped__' : String(raw)
      if (!buckets.has(key)) buckets.set(key, [])
      buckets.get(key).push(row)
    }
    const entries = [...buckets.entries()]
    entries.sort(([a], [b]) => {
      if (a === '__ungrouped__') return 1
      if (b === '__ungrouped__') return -1
      return a.localeCompare(b, 'th')
    })
    return entries.map(([key, items]) => ({
      key,
      label: key === '__ungrouped__' ? '— ไม่ระบุ —' : key,
      rows: items,
    }))
  }, [filteredRows, table.groupByField])

  const toggleGroup = (key) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Sort cycle: off → asc → desc → off
  const handleSortClick = (colKey) => {
    setSort((prev) => {
      if (!prev || prev.key !== colKey) return { key: colKey, dir: 'asc' }
      if (prev.dir === 'asc') return { key: colKey, dir: 'desc' }
      return null
    })
  }

  // ---------- CRUD handlers (unchanged) ----------
  const handleCreate = async (payload) => {
    setSubmitting(true)
    try {
      const supabase = getClient()
      const clean = { ...payload }
      if (!clean.id) delete clean.id
      const { data, error } = await supabase.from(tableId).insert(clean).select().single()
      if (error) throw error
      await logAudit({ action: 'create', tableName: tableId, recordId: data?.id, after: data })
      toast('success', 'เพิ่มข้อมูลสำเร็จ')
      setEditing(null)
      await load()
    } catch (e) {
      toast('error', friendlyError(e))
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (payload) => {
    if (!editing || editing === 'new') return
    setSubmitting(true)
    try {
      const supabase = getClient()
      const id = editing.id
      if (!id) throw new Error('ข้อมูลนี้ไม่มีรหัส (id) ไม่สามารถบันทึกได้')
      const clean = { ...payload }
      delete clean.id
      delete clean.created_at

      const { data: latest, error: readErr } = await supabase
        .from(tableId)
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (readErr) throw readErr
      if (!latest) throw new Error('ข้อมูลนี้ถูกลบไปแล้วโดยผู้ใช้อื่น')

      if (editing.updated_at && latest.updated_at && latest.updated_at !== editing.updated_at) {
        const proceed = window.confirm(
          'มีผู้อื่นแก้ไขข้อมูลนี้ไปแล้วระหว่างที่คุณกำลังแก้อยู่\n\n' +
            'ถ้ากด "OK" การเปลี่ยนแปลงของพวกเขาจะถูกเขียนทับด้วยของคุณ\n' +
            'ถ้ากด "Cancel" จะยกเลิกการบันทึกเพื่อโหลดข้อมูลใหม่'
        )
        if (!proceed) {
          setSubmitting(false)
          setEditing(null)
          await load()
          return
        }
      }

      const { data, error } = await supabase
        .from(tableId)
        .update(clean)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      await logAudit({
        action: 'update',
        tableName: tableId,
        recordId: id,
        before: editing,
        after: data,
      })
      toast('success', 'บันทึกข้อมูลสำเร็จ')
      setEditing(null)
      await load()
    } catch (e) {
      toast('error', friendlyError(e))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setSubmitting(true)
    try {
      const supabase = getClient()
      const id = deleting.id
      if (!id) throw new Error('ข้อมูลนี้ไม่มีรหัส (id) ไม่สามารถลบได้')
      const { error } = await supabase.from(tableId).delete().eq('id', id)
      if (error) throw error
      await logAudit({ action: 'delete', tableName: tableId, recordId: id, before: deleting })
      toast('success', 'ลบข้อมูลสำเร็จ')
      setDeleting(null)
      await load()
    } catch (e) {
      toast('error', friendlyError(e))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDuplicate = (row) => {
    const copy = { ...row }
    delete copy.id
    delete copy.created_at
    delete copy.updated_at
    setEditing({ __isDuplicate: true, ...copy })
  }

  const handleExport = () => {
    if (!rows.length) {
      toast('warning', 'ไม่มีข้อมูลให้ export')
      return
    }
    const csv = toCSV(rows, columns)
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    downloadCSV(`${tableId}_${ts}.csv`, csv)
    toast('success', 'ดาวน์โหลด CSV สำเร็จ')
  }

  const handleCloseEditor = () => {
    if (submitting) return
    if (editorRef.current?.isDirty?.()) {
      setExitConfirm(true)
    } else {
      setEditing(null)
    }
  }

  const confirmExit = () => {
    setExitConfirm(false)
    setEditing(null)
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const editorTitle = useMemo(() => {
    if (!editing) return ''
    if (editing === 'new') return `เพิ่ม${table.label}`
    if (editing.__isDuplicate) return `คัดลอกเป็น${table.label}ใหม่`
    return `แก้ไข${table.label}`
  }, [editing, table.label])

  const isCreating = editing === 'new' || editing?.__isDuplicate

  // Are any filters or sorts active?
  const hasActiveFiltersOrSort = filters.length > 0 || !!sort

  // Render a single data row (reused by flat + grouped tbody)
  const renderRow = (row, idx) => (
    <tr
      key={row.id || `row-${idx}`}
      className="border-b border-brand-100 dark:border-brand-800/50 hover:bg-brand-50/50 dark:hover:bg-brand-800/20 transition-colors"
    >
      {visibleColumnsOrdered.map((col) => {
        const meta = col.meta || getColumnMeta(table, col.key)
        const effectiveType = meta.type || col.type
        const isPrimary = primaryKey && col.key === primaryKey
        return (
          <td
            key={col.key}
            className={`px-3 py-2 max-w-xs truncate ${isPrimary ? 'font-semibold' : ''}`}
            title={formatCell(row[col.key], effectiveType)}
          >
            <CellValue value={row[col.key]} type={effectiveType} />
          </td>
        )
      })}
      <td className="px-1 py-1 text-right whitespace-nowrap sticky right-0 bg-white dark:bg-brand-900">
        <div className="flex items-center justify-end gap-0.5">
          <IconButton onClick={() => setEditing(row)} title="แก้ไข" icon={Pencil} />
          <IconButton
            onClick={() => handleDuplicate(row)}
            title="คัดลอกเป็นรายการใหม่"
            icon={Copy}
          />
          <IconButton
            onClick={() => setDeleting(row)}
            title="ลบ"
            icon={Trash2}
            danger
          />
        </div>
      </td>
    </tr>
  )

  // Readable label for an active filter chip
  const filterChipLabel = (f) => {
    const def = filterDefs.find((d) => d.key === f.key)
    const label = def?.label ?? f.key
    if (f.kind === 'enum') return `${label}: ${(f.value || []).join(', ')}`
    if (f.kind === 'range') {
      const { min, max } = f.value || {}
      const unit = def?.unit ? ` ${def.unit}` : ''
      if (min !== undefined && min !== '' && max !== undefined && max !== '') return `${label}: ${min}–${max}${unit}`
      if (min !== undefined && min !== '') return `${label}: ≥${min}${unit}`
      if (max !== undefined && max !== '') return `${label}: ≤${max}${unit}`
      return label
    }
    if (f.kind === 'dateRange') {
      const { from, to } = f.value || {}
      if (from && to) return `${label}: ${from} – ${to}`
      if (from) return `${label}: จาก ${from}`
      if (to) return `${label}: ถึง ${to}`
      return label
    }
    if (f.kind === 'boolean') return `${label}: ${f.value ? 'ใช่' : 'ไม่ใช่'}`
    if (f.kind === 'text') return `${label}: "${f.value}"`
    return label
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{table.label}</h1>
          {table.description && (
            <p className="text-sm text-brand-500 dark:text-brand-400 mt-0.5">
              {table.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="btn btn-secondary"
            onClick={() => load()}
            disabled={loading}
            title="รีเฟรช"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>
          <button className="btn btn-secondary" onClick={handleExport} title="Export CSV">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">ดาวน์โหลด CSV</span>
          </button>
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            <Plus className="w-4 h-4" />
            เพิ่มข้อมูลใหม่
          </button>
        </div>
      </div>

      {/* Search + filter toolbar */}
      <div className="card p-3 flex flex-col sm:flex-row gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="พิมพ์เพื่อค้นหา..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter button */}
        {filterDefs.length > 0 && (
          <div className="relative" ref={filterRef}>
            <button
              className={`btn btn-secondary ${filters.length > 0 ? 'ring-2 ring-brand-400' : ''}`}
              onClick={() => { setFilterOpen((o) => !o); setColumnsOpen(false) }}
              title="กรองข้อมูล"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">+ กรอง</span>
              {filters.length > 0 && (
                <span className="ml-1 badge bg-brand-600 text-white !text-xs !py-0 !px-1.5">
                  {filters.length}
                </span>
              )}
            </button>
            {filterOpen && (
              <FilterPanel
                filterDefs={filterDefs}
                filters={filters}
                setFilters={setFilters}
                rows={rows}
                onClose={() => setFilterOpen(false)}
              />
            )}
          </div>
        )}

        {/* Columns menu button */}
        <div className="relative" ref={columnsRef}>
          <button
            className="btn btn-secondary"
            onClick={() => { setColumnsOpen((o) => !o); setFilterOpen(false) }}
            title="เลือกคอลัมน์"
          >
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">คอลัมน์</span>
          </button>
          {columnsOpen && visibleKeys && (
            <ColumnsMenu
              groups={colGroups}
              visibleKeys={visibleKeys}
              setVisibleKeys={(next) => {
                setVisibleKeys(next)
              }}
              onClose={() => setColumnsOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {(filters.length > 0 || sort) && (
        <div className="flex flex-wrap gap-2 items-center">
          {filters.map((f) => (
            <span
              key={f.key}
              className="inline-flex items-center gap-1 badge bg-brand-100 dark:bg-brand-800 text-brand-700 dark:text-brand-200 !text-xs !py-1 !px-2"
            >
              {filterChipLabel(f)}
              <button
                className="ml-0.5 text-brand-400 hover:text-brand-700 dark:hover:text-brand-200"
                onClick={() => setFilters((prev) => prev.filter((x) => x.key !== f.key))}
                title="ลบตัวกรองนี้"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {sort && (
            <span className="inline-flex items-center gap-1 badge bg-brand-100 dark:bg-brand-800 text-brand-700 dark:text-brand-200 !text-xs !py-1 !px-2">
              {sort.dir === 'asc' ? '↑' : '↓'} {columnLabel(table, sort.key)}
              <button
                className="ml-0.5 text-brand-400 hover:text-brand-700 dark:hover:text-brand-200"
                onClick={() => setSort(null)}
                title="ยกเลิกการเรียงลำดับ"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 underline"
            onClick={() => { setFilters([]); setSort(null) }}
          >
            ล้างทั้งหมด
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading && rows.length === 0 ? (
          <CenteredSpinner label="กำลังโหลดข้อมูล..." />
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
            <p className="font-medium text-red-600 dark:text-red-400">อ่านข้อมูลไม่ได้</p>
            <p className="text-sm text-brand-600 dark:text-brand-400 mt-2 max-w-md mx-auto">
              {error}
            </p>
            <p className="text-xs text-brand-500 mt-4">
              หากเพิ่งเพิ่ม table ใหม่ ลองรีเฟรชหน้าจอ หรือติดต่อทีม IT
            </p>
            <button className="btn btn-secondary mt-4" onClick={() => load()}>
              <RefreshCw className="w-4 h-4" />
              ลองอีกครั้ง
            </button>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center text-brand-500">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-800 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <p className="font-medium mb-1">
              {search || filters.length > 0 ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีข้อมูล'}
            </p>
            <p className="text-xs">
              {search || filters.length > 0
                ? 'ลองพิมพ์คำอื่น หรือล้างการค้นหา / ตัวกรอง'
                : 'กดปุ่ม "เพิ่มข้อมูลใหม่" ด้านบนเพื่อเริ่มใช้งาน'}
            </p>
          </div>
        ) : (
          <>
            {/* Scope banner */}
            {hasActiveFiltersOrSort && (
              <div className="px-4 pt-2 pb-0">
                <p className="text-xs text-brand-500 italic">
                  *ค้นหา / กรอง / จัดเรียง ทำงานเฉพาะรายการในหน้านี้ ({rows.length} รายการ)*
                </p>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-50 dark:bg-brand-950/50">
                  {/* Row 1: group spans */}
                  <tr className="border-b border-brand-200 dark:border-brand-800">
                    {visibleGroups.map((g, gi) => (
                      <th
                        key={g.key}
                        colSpan={g.columns.length}
                        className={`px-3 py-1.5 text-left text-xs font-medium text-brand-400 dark:text-brand-500 whitespace-nowrap ${
                          gi < visibleGroups.length - 1
                            ? 'border-r border-brand-200 dark:border-brand-800'
                            : ''
                        }`}
                      >
                        {g.label}
                      </th>
                    ))}
                    {/* Actions column header placeholder */}
                    <th className="px-3 py-1.5 sticky right-0 bg-brand-50 dark:bg-brand-950/50" />
                  </tr>
                  {/* Row 2: individual column headers */}
                  <tr className="border-b border-brand-200 dark:border-brand-800">
                    {visibleColumnsOrdered.map((col) => {
                      const meta = col.meta || getColumnMeta(table, col.key)
                      const isSortable = meta.sortable === true
                      const sortDir = sort?.key === col.key ? sort.dir : null
                      return (
                        <th
                          key={col.key}
                          className={`px-3 py-2.5 text-left font-semibold text-brand-700 dark:text-brand-300 whitespace-nowrap ${
                            isSortable ? 'cursor-pointer select-none hover:bg-brand-100 dark:hover:bg-brand-800/50' : ''
                          }`}
                          onClick={isSortable ? () => handleSortClick(col.key) : undefined}
                        >
                          <span className="inline-flex items-center gap-0.5">
                            {columnLabel(table, col.key)}
                            {meta.description && <InfoTooltip description={meta.description} />}
                            {isSortable && <SortIcon dir={sortDir} />}
                          </span>
                        </th>
                      )
                    })}
                    <th className="px-3 py-2.5 text-right sticky right-0 bg-brand-50 dark:bg-brand-950/50 font-semibold text-brand-700 dark:text-brand-300">
                      การจัดการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupedRows
                    ? groupedRows.map((g) => {
                        const collapsed = collapsedGroups.has(g.key)
                        return (
                          <Fragment key={`grp-${g.key}`}>
                            <tr className="bg-brand-100/60 dark:bg-brand-800/40 border-b border-brand-200 dark:border-brand-700">
                              <td
                                colSpan={visibleColumnsOrdered.length + 1}
                                className="px-3 py-2 cursor-pointer select-none"
                                onClick={() => toggleGroup(g.key)}
                              >
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-800 dark:text-brand-200">
                                  {collapsed ? (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                  {table.groupByLabel && (
                                    <span className="text-brand-500 dark:text-brand-400 font-normal">
                                      {table.groupByLabel}:
                                    </span>
                                  )}
                                  <span>{g.label}</span>
                                  <span className="badge bg-brand-200 dark:bg-brand-700 text-brand-700 dark:text-brand-200 !text-[10px] !py-0 !px-1.5 ml-1">
                                    {g.rows.length}
                                  </span>
                                </span>
                              </td>
                            </tr>
                            {!collapsed &&
                              g.rows.map((row, idx) => renderRow(row, `${g.key}-${idx}`))}
                          </Fragment>
                        )
                      })
                    : filteredRows.map((row, idx) => renderRow(row, idx))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-2 text-sm">
          <div className="text-brand-500">
            หน้า{' '}
            <span className="font-semibold text-brand-800 dark:text-brand-200">{page + 1}</span>{' '}
            / {totalPages} · ทั้งหมด {totalCount.toLocaleString()} รายการ
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary"
              disabled={page === 0 || loading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
              ก่อนหน้า
            </button>
            <button
              className="btn btn-secondary"
              disabled={page >= totalPages - 1 || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              ถัดไป
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={!!editing}
        onClose={handleCloseEditor}
        title={editorTitle}
        size="lg"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={handleCloseEditor}
              disabled={submitting}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              form="row-editor-form"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting && <Spinner className="w-4 h-4" />}
              {isCreating ? 'เพิ่มข้อมูล' : 'บันทึก'}
            </button>
          </>
        }
      >
        {editing && (
          <RowEditor
            ref={editorRef}
            columns={columns.length > 0 ? columns : [{ key: 'id', type: 'uuid', readOnly: true }]}
            initialRow={
              editing === 'new'
                ? defaultCreateValues || null
                : editing?.__isDuplicate
                ? null
                : editing
            }
            onSubmit={isCreating ? handleCreate : handleUpdate}
            submitting={submitting}
            table={table}
            requiredColumns={requiredColumns}
          />
        )}
      </Modal>

      {/* Unsaved changes warning */}
      <ConfirmDialog
        isOpen={exitConfirm}
        onCancel={() => setExitConfirm(false)}
        onConfirm={confirmExit}
        title="ออกโดยไม่บันทึก?"
        message="คุณยังไม่ได้บันทึกการเปลี่ยนแปลง หากออกตอนนี้ข้อมูลที่กรอกจะหายไปทั้งหมด"
        confirmLabel="ออกโดยไม่บันทึก"
        danger
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="ยืนยันการลบ"
        message={
          <div>
            <p>
              คุณกำลังจะลบข้อมูลจาก <strong>{table.label}</strong> — การลบไม่สามารถย้อนกลับได้
            </p>
            {deleting && (
              <div className="mt-3 p-3 bg-brand-50 dark:bg-brand-950 rounded-lg text-xs max-h-32 overflow-auto">
                {/* Primary display key shown as bold identity line */}
                {primaryKey && deleting[primaryKey] !== undefined && (
                  <div className="font-bold text-brand-800 dark:text-brand-200 mb-1 truncate">
                    {String(deleting[primaryKey])}
                  </div>
                )}
                {Object.entries(deleting)
                  .filter(([k]) => !['id', 'created_at', 'updated_at'].includes(k))
                  .slice(0, 3)
                  .map(([k, v]) => (
                    <div key={k} className="truncate">
                      <span className="text-brand-500">{columnLabel(table, k)}:</span>{' '}
                      <span className="font-medium">
                        {v === null || v === undefined
                          ? '—'
                          : typeof v === 'object'
                          ? JSON.stringify(v)
                          : String(v)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        }
        confirmLabel="ลบถาวร"
        danger
        requireTyping="ลบ"
        submitting={submitting}
      />
    </div>
  )
}
