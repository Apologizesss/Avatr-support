import { READONLY_COLUMNS } from './tables'

/**
 * Given an array of rows, infer the column schema.
 * Returns array of { key, type, readOnly }.
 */
export function inferSchema(rows) {
  if (!rows || rows.length === 0) return []
  const columnSet = new Map()
  rows[0] && Object.keys(rows[0]).forEach((k) => columnSet.set(k, null))
  rows.forEach((r) => {
    if (r) Object.keys(r).forEach((k) => columnSet.set(k, columnSet.get(k) ?? null))
  })

  const columns = []
  for (const key of columnSet.keys()) {
    let sampleVal = null
    for (const r of rows) {
      if (r && r[key] !== null && r[key] !== undefined) {
        sampleVal = r[key]
        break
      }
    }
    columns.push({
      key,
      type: detectType(sampleVal),
      readOnly: READONLY_COLUMNS.has(key),
    })
  }
  return columns
}

/**
 * Infer which columns appear "required" based on data.
 * Heuristic: if >=80% of rows have a non-null value, assume required.
 * Returns Set<string>.
 */
export function inferRequired(rows) {
  const required = new Set()
  if (!rows || rows.length < 3) return required // too few rows to infer
  const columns = Object.keys(rows[0] || {})
  for (const col of columns) {
    if (READONLY_COLUMNS.has(col)) continue
    const nonNull = rows.filter(
      (r) => r[col] !== null && r[col] !== undefined && r[col] !== ''
    ).length
    const ratio = nonNull / rows.length
    if (ratio >= 0.8) required.add(col)
  }
  return required
}

function detectType(value) {
  if (value === null || value === undefined) return 'text'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'object') return 'json'
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return 'timestamp'
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date'
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))
      return 'uuid'
    if (value.length > 100) return 'longtext'
    return 'text'
  }
  return 'text'
}

export function formatCell(value, type) {
  if (value === null || value === undefined) return ''
  if (type === 'boolean') return value ? 'ใช่' : 'ไม่'
  if (type === 'timestamp' || type === 'date') {
    try {
      const d = new Date(value)
      if (isNaN(d)) return String(value)
      return d.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return String(value)
    }
  }
  if (type === 'json') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

export function parseInputValue(raw, type) {
  if (raw === '' || raw === null || raw === undefined) {
    if (type === 'image_gallery') return []
    return null
  }
  if (type === 'boolean') return raw === 'true' || raw === true
  if (type === 'number') {
    const n = Number(raw)
    return isNaN(n) ? null : n
  }
  if (type === 'image_gallery') {
    if (Array.isArray(raw)) return raw.filter((x) => typeof x === 'string' && x.trim() !== '')
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          return parsed.filter((x) => typeof x === 'string' && x.trim() !== '')
        }
      } catch {
        // fall through
      }
    }
    return []
  }
  if (type === 'json') {
    if (typeof raw === 'object') return raw
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  }
  return raw
}

export function toCSV(rows, columns) {
  if (!rows || rows.length === 0) return ''
  const keys = columns.map((c) => c.key)
  const header = keys.map(escapeCSV).join(',')
  const body = rows
    .map((r) =>
      keys
        .map((k) => {
          const v = r[k]
          if (v === null || v === undefined) return ''
          if (typeof v === 'object') return escapeCSV(JSON.stringify(v))
          return escapeCSV(String(v))
        })
        .join(',')
    )
    .join('\n')
  return header + '\n' + body
}

function escapeCSV(s) {
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

/**
 * Apply a list of client-side filters to rows.
 *
 * Each filter shape:
 *   { key, kind, value }
 * where kind ∈ {'enum', 'range', 'dateRange', 'boolean', 'text'} and:
 *   - enum:      value = string[] (selected values)  → row[key] ∈ value
 *   - range:     value = { min?: number, max?: number }
 *   - dateRange: value = { from?: ISO-string, to?: ISO-string }
 *   - boolean:   value = true | false
 *   - text:      value = string (case-insensitive substring)
 *
 * Filters are AND-combined. Empty / null / undefined values are skipped.
 */
export function applyClientFilters(rows, filters) {
  if (!filters || filters.length === 0) return rows
  return rows.filter((row) => {
    for (const f of filters) {
      const cell = row?.[f.key]
      if (f.kind === 'enum') {
        const list = Array.isArray(f.value) ? f.value : []
        if (list.length === 0) continue
        if (cell === null || cell === undefined) return false
        if (!list.includes(String(cell))) return false
      } else if (f.kind === 'range') {
        const { min, max } = f.value || {}
        const num = typeof cell === 'number' ? cell : Number(cell)
        if (Number.isNaN(num)) return false
        if (min !== null && min !== undefined && min !== '' && num < Number(min)) return false
        if (max !== null && max !== undefined && max !== '' && num > Number(max)) return false
      } else if (f.kind === 'dateRange') {
        const { from, to } = f.value || {}
        if (!cell) return false
        const t = new Date(cell).getTime()
        if (Number.isNaN(t)) return false
        if (from && t < new Date(from).getTime()) return false
        if (to && t > new Date(to).getTime() + 86399999) return false // include end-of-day
      } else if (f.kind === 'boolean') {
        if (f.value === null || f.value === undefined) continue
        if (Boolean(cell) !== Boolean(f.value)) return false
      } else if (f.kind === 'text') {
        const q = String(f.value || '').toLowerCase()
        if (!q) continue
        if (cell === null || cell === undefined) return false
        const hay =
          typeof cell === 'object' ? JSON.stringify(cell).toLowerCase() : String(cell).toLowerCase()
        if (!hay.includes(q)) return false
      }
    }
    return true
  })
}

/**
 * Sort rows by a single column. `dir` is 'asc' | 'desc'. Stable for equal values.
 * Numeric / date / string aware; nulls/undefined sort to the bottom.
 */
export function sortRows(rows, key, dir, type) {
  if (!key || !dir) return rows
  const sign = dir === 'desc' ? -1 : 1
  const indexed = rows.map((r, i) => [r, i])
  indexed.sort(([a, ai], [b, bi]) => {
    const av = a?.[key]
    const bv = b?.[key]
    const aNull = av === null || av === undefined || av === ''
    const bNull = bv === null || bv === undefined || bv === ''
    if (aNull && bNull) return ai - bi
    if (aNull) return 1
    if (bNull) return -1

    let cmp = 0
    if (type === 'number') {
      cmp = Number(av) - Number(bv)
    } else if (type === 'date' || type === 'timestamp') {
      cmp = new Date(av).getTime() - new Date(bv).getTime()
    } else if (type === 'boolean') {
      cmp = (av ? 1 : 0) - (bv ? 1 : 0)
    } else {
      cmp = String(av).localeCompare(String(bv), 'th')
    }
    if (cmp === 0) return ai - bi
    return cmp * sign
  })
  return indexed.map(([r]) => r)
}

export function downloadCSV(filename, csv) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
