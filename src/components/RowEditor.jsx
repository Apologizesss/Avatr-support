import { useEffect, useMemo, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { Info, ChevronRight } from 'lucide-react'
import { parseInputValue } from '../lib/utils'
import { columnLabel, getColumnMeta, groupedColumns } from '../lib/tables'
import { ImageGalleryField, parseImageGalleryValue } from './ImageGalleryField'

/**
 * RowEditor: renders a form based on columns, grouped into collapsible sections.
 * - `initialRow`: for edit mode (null for create)
 * - `onSubmit(payload)`: called with parsed values
 * - `table`: the table config object (for labels)
 * - `requiredColumns`: Set<string> of column keys considered required
 *
 * Exposes (via ref):
 *   - isDirty(): boolean — whether user has made changes
 */
export const RowEditor = forwardRef(function RowEditor(
  { columns, initialRow, onSubmit, submitting, table, requiredColumns },
  ref
) {
  const [values, setValues] = useState({})
  const [initialValues, setInitialValues] = useState({})
  const [errors, setErrors] = useState({})
  const [openSections, setOpenSections] = useState(new Set())
  const formRef = useRef(null)

  // Build grouped sections from all columns (editable + system)
  const sections = useMemo(() => {
    return groupedColumns(table, columns)
  }, [table, columns])

  // Compute default-open sections:
  // 1. First non-system group
  // 2. Any group containing a required field
  const defaultOpenSections = useMemo(() => {
    const open = new Set()
    let firstNonSystem = null
    for (const section of sections) {
      if (section.key !== 'system') {
        if (firstNonSystem === null) firstNonSystem = section.key
        if (requiredColumns) {
          for (const col of section.columns) {
            if (requiredColumns.has(col.key)) {
              open.add(section.key)
              break
            }
          }
        }
      }
    }
    if (firstNonSystem) open.add(firstNonSystem)
    return open
  }, [sections, requiredColumns])

  // Initialise open sections when modal opens (initialRow changes)
  useEffect(() => {
    setOpenSections(new Set(defaultOpenSections))
  }, [initialRow]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const init = {}
    for (const col of columns) {
      const meta = getColumnMeta(table, col.key)
      const effectiveType = meta?.type || col.type
      const v = initialRow?.[col.key]
      if (v === null || v === undefined) {
        init[col.key] = effectiveType === 'image_gallery' ? '[]' : ''
      } else if (effectiveType === 'image_gallery') {
        init[col.key] =
          typeof v === 'string' ? v : JSON.stringify(parseImageGalleryValue(v))
      } else if (col.type === 'json') {
        init[col.key] = typeof v === 'string' ? v : JSON.stringify(v, null, 2)
      } else {
        init[col.key] = v
      }
    }
    setValues(init)
    setInitialValues(init)
    setErrors({})
  }, [initialRow, columns, table])

  useImperativeHandle(ref, () => ({
    isDirty: () => {
      for (const k of Object.keys(values)) {
        if (String(values[k] ?? '') !== String(initialValues[k] ?? '')) return true
      }
      return false
    },
  }))

  const handleChange = (key, val) => {
    setValues((v) => ({ ...v, [key]: val }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {}
    const newErrors = {}

    // Only validate editable (non-readOnly) columns
    for (const section of sections) {
      for (const col of section.columns) {
        if (col.readOnly) continue
        const raw = values[col.key]
        const effectiveType = col.meta?.type || col.type
        let isEmpty = raw === '' || raw === null || raw === undefined
        if (effectiveType === 'image_gallery') {
          isEmpty = parseImageGalleryValue(raw).length === 0
        }

        // Required check
        if (requiredColumns?.has(col.key) && isEmpty) {
          newErrors[col.key] = 'กรุณากรอกข้อมูลในช่องนี้'
          continue
        }

        // JSON validation
        if (col.type === 'json' && effectiveType !== 'image_gallery' && !isEmpty) {
          try {
            JSON.parse(raw)
          } catch {
            newErrors[col.key] = 'รูปแบบ JSON ไม่ถูกต้อง'
            continue
          }
        }

        payload[col.key] = parseInputValue(raw, effectiveType)
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)

      // Auto-open sections that contain errored fields
      const erroredKeys = new Set(Object.keys(newErrors))
      const sectionsToOpen = new Set()
      for (const section of sections) {
        for (const col of section.columns) {
          if (erroredKeys.has(col.key)) {
            sectionsToOpen.add(section.key)
            break
          }
        }
      }
      setOpenSections((prev) => {
        const next = new Set(prev)
        for (const k of sectionsToOpen) next.add(k)
        return next
      })

      // Scroll to first errored input after state update (next tick)
      setTimeout(() => {
        if (!formRef.current) return
        const firstErrorKey = Object.keys(newErrors)[0]
        const el = formRef.current.querySelector(
          `[data-field="${firstErrorKey}"]`
        )
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.focus()
        }
      }, 50)

      return
    }

    onSubmit(payload)
  }

  // Derive editable columns count (for empty-state message)
  const editableCount = useMemo(
    () => columns.filter((c) => !c.readOnly).length,
    [columns]
  )

  return (
    <form ref={formRef} onSubmit={handleSubmit} id="row-editor-form" className="space-y-0">
      {editableCount === 0 && (
        <div className="text-center py-6 text-brand-500 text-sm">
          ไม่มีช่องให้กรอก (ทุก column เป็น read-only)
        </div>
      )}

      {sections.map((section, sectionIdx) => {
        // System section: only show in edit mode
        if (section.key === 'system' && !initialRow) return null

        const isOpen = openSections.has(section.key)
        const isSystem = section.key === 'system'
        const isLast = sectionIdx === sections.length - 1

        return (
          <details
            key={section.key}
            open={isOpen}
            onToggle={(e) => {
              // Sync controlled state when user clicks summary
              const nowOpen = e.currentTarget.open
              setOpenSections((prev) => {
                const next = new Set(prev)
                if (nowOpen) next.add(section.key)
                else next.delete(section.key)
                return next
              })
            }}
            className={`${!isLast ? 'border-b border-brand-200 dark:border-brand-800 pb-3 mb-3' : ''}`}
          >
            <summary
              className={`
                cursor-pointer flex items-center gap-1.5 py-1 list-none select-none
                ${isSystem
                  ? 'text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-300'
                  : 'text-sm font-semibold text-brand-700 dark:text-brand-200 hover:text-brand-900 dark:hover:text-white'}
              `}
            >
              <ChevronRight
                className={`
                  w-3.5 h-3.5 flex-shrink-0 transition-transform duration-150
                  ${isOpen ? 'rotate-90' : ''}
                  ${isSystem ? 'text-brand-400' : 'text-brand-500 dark:text-brand-400'}
                `}
              />
              {isSystem && <Info className="w-3 h-3 flex-shrink-0" />}
              <span className="flex-1">{section.label}</span>
              <span
                className={`ml-auto font-normal ${isSystem ? 'text-[10px]' : 'text-xs'} text-brand-400`}
              >
                {section.columns.length} ช่อง
              </span>
            </summary>

            <div className="mt-3 space-y-4">
              {section.columns.map((col) => {
                if (isSystem) {
                  return (
                    <div key={col.key}>
                      <label className="flex items-baseline justify-between mb-1">
                        <span className="text-xs text-brand-500">
                          {columnLabel(table, col.key)}
                        </span>
                        <span className="text-[10px] font-mono text-brand-400">{col.key}</span>
                      </label>
                      <input
                        className="input opacity-60 cursor-not-allowed font-mono text-xs"
                        value={values[col.key] ?? ''}
                        readOnly
                        disabled
                      />
                    </div>
                  )
                }

                const label = columnLabel(table, col.key)
                const meta = col.meta || getColumnMeta(table, col.key)
                const isRequired = requiredColumns?.has(col.key)

                return (
                  <div key={col.key}>
                    <label className="flex items-baseline justify-between mb-1">
                      <span className="flex items-center gap-1 text-sm font-medium text-brand-700 dark:text-brand-300">
                        {label}
                        {isRequired && <span className="text-red-500 ml-1">*</span>}
                        {meta?.description && (
                          <Info
                            className="w-3.5 h-3.5 text-brand-400 dark:text-brand-500 inline-block align-middle"
                            title={meta.description}
                          />
                        )}
                      </span>
                      <span className="text-[10px] font-mono text-brand-400">{col.key}</span>
                    </label>

                    <FieldInput
                      col={col}
                      meta={meta}
                      value={values[col.key] ?? ''}
                      onChange={(v) => handleChange(col.key, v)}
                      tableId={table?.id}
                      rowId={initialRow?.id}
                      hasError={!!errors[col.key]}
                    />

                    {errors[col.key] && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {errors[col.key]}
                      </p>
                    )}

                    {meta?.description && !errors[col.key] && (
                      <p className="flex items-start gap-1 text-[11px] text-brand-500 dark:text-brand-400 mt-1">
                        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
                        <span>{meta.description}</span>
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </details>
        )
      })}

      <button type="submit" className="hidden" disabled={submitting}>
        Submit
      </button>
    </form>
  )
})

function FieldInput({ col, meta, value, onChange, hasError, tableId, rowId }) {
  const errorClass = hasError ? '!border-red-500 dark:!border-red-400' : ''

  // Image gallery (up to 5 URLs)
  if (meta?.type === 'image_gallery') {
    return (
      <ImageGalleryField
        value={value}
        onChange={onChange}
        hasError={hasError}
        columnKey={col.key}
        tableId={tableId}
        rowId={rowId}
      />
    )
  }

  // Enum: meta.type === 'enum' OR meta.enumOptions exists
  const hasEnumOptions = meta?.enumOptions && Array.isArray(meta.enumOptions) && meta.enumOptions.length > 0
  if (meta?.type === 'enum' || hasEnumOptions) {
    if (!hasEnumOptions) {
      // enumOptions missing but type is 'enum' — fall back to text input
      return (
        <input
          type="text"
          className={`input ${errorClass}`}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          data-field={col.key}
        />
      )
    }
    return (
      <select
        className={`input ${errorClass}`}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        data-field={col.key}
      >
        <option value="">— ไม่ระบุ —</option>
        {meta.enumOptions.map((opt) => {
          const optValue = typeof opt === 'object' ? opt.value : opt
          const optLabel = typeof opt === 'object' ? opt.label : opt
          return (
            <option key={optValue} value={optValue}>
              {optLabel}
            </option>
          )
        })}
      </select>
    )
  }

  if (col.type === 'boolean') {
    return (
      <select
        className={`input ${errorClass}`}
        value={String(value)}
        onChange={(e) => onChange(e.target.value === 'true')}
        data-field={col.key}
      >
        <option value="">— ไม่ระบุ —</option>
        <option value="true">ใช่ (true)</option>
        <option value="false">ไม่ใช่ (false)</option>
      </select>
    )
  }
  if (col.type === 'number') {
    return (
      <input
        type="number"
        className={`input ${errorClass}`}
        value={value ?? ''}
        step="any"
        onChange={(e) => onChange(e.target.value)}
        data-field={col.key}
      />
    )
  }
  if (col.type === 'json') {
    return (
      <>
        <textarea
          className={`input font-mono text-xs ${errorClass}`}
          rows={5}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder='{"key": "value"}'
          data-field={col.key}
        />
        <p className="text-[10px] text-brand-500 mt-1">
          💡 รูปแบบ JSON เช่น <code>{`{"key": "value"}`}</code> หรือ <code>[1, 2, 3]</code>
        </p>
      </>
    )
  }
  if (col.type === 'longtext') {
    return (
      <textarea
        className={`input ${errorClass}`}
        rows={4}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        data-field={col.key}
      />
    )
  }
  if (col.type === 'timestamp' || col.type === 'date') {
    return (
      <input
        type={col.type === 'date' ? 'date' : 'datetime-local'}
        className={`input ${errorClass}`}
        value={toLocalInputValue(value, col.type)}
        onChange={(e) =>
          onChange(e.target.value ? new Date(e.target.value).toISOString() : '')
        }
        data-field={col.key}
      />
    )
  }
  return (
    <input
      type="text"
      className={`input ${errorClass}`}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      data-field={col.key}
    />
  )
}

function toLocalInputValue(v, type) {
  if (!v) return ''
  try {
    const d = new Date(v)
    if (isNaN(d)) return ''
    if (type === 'date') return d.toISOString().slice(0, 10)
    const tz = d.getTimezoneOffset() * 60000
    return new Date(d - tz).toISOString().slice(0, 16)
  } catch {
    return ''
  }
}
