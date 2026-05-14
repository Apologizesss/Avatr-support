import { useEffect, useState } from 'react'
import { Image as ImageIcon, X, Link2 } from 'lucide-react'

export const MAX_IMAGES = 5

function isValidUrl(s) {
  if (!s) return false
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function parseImageGalleryValue(v) {
  if (!v) return []
  if (Array.isArray(v)) return v.filter((x) => typeof x === 'string' && x.trim() !== '')
  if (typeof v === 'string') {
    const trimmed = v.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string' && x.trim() !== '')
    } catch {
      // not JSON — could be a single URL
    }
    if (trimmed.startsWith('http')) return [trimmed]
  }
  return []
}

export function serializeImageGalleryValue(arr) {
  const compact = (arr || []).filter((x) => typeof x === 'string' && x.trim() !== '').slice(0, MAX_IMAGES)
  return JSON.stringify(compact)
}

/**
 * 5-slot image gallery editor (URL only — no upload).
 * Stores value as a JSON-stringified array of URLs (matching the JSON-string
 * pattern used by other complex types in RowEditor).
 */
export function ImageGalleryField({ value, onChange, hasError, columnKey }) {
  const urls = parseImageGalleryValue(value)
  const slots = [...urls]
  while (slots.length < MAX_IMAGES) slots.push('')

  const update = (next) => {
    onChange(serializeImageGalleryValue(next))
  }

  const setSlot = (idx, url) => {
    const next = [...slots]
    next[idx] = url
    update(next)
  }

  const removeSlot = (idx) => {
    const next = [...slots]
    next.splice(idx, 1)
    next.push('')
    update(next)
  }

  const filledCount = urls.length

  return (
    <div data-field={columnKey} className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-brand-500 dark:text-brand-400">
          {filledCount} / {MAX_IMAGES} ภาพ
        </span>
        {filledCount > 0 && (
          <button
            type="button"
            onClick={() => update([])}
            className="text-[11px] text-brand-500 hover:text-red-600 underline"
          >
            ล้างทั้งหมด
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {slots.slice(0, MAX_IMAGES).map((url, idx) => (
          <ImageSlot
            key={idx}
            index={idx}
            url={url}
            onChange={(u) => setSlot(idx, u)}
            onRemove={() => removeSlot(idx)}
            hasError={hasError && idx === 0 && !url}
          />
        ))}
      </div>

      <p className="text-[11px] text-brand-500 dark:text-brand-400 flex items-start gap-1">
        <Link2 className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
        วาง URL รูปภาพ (สูงสุด {MAX_IMAGES} ภาพ) — รองรับ http(s)
      </p>
    </div>
  )
}

function ImageSlot({ index, url, onChange, onRemove, hasError }) {
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    setLoadError(false)
  }, [url])

  const valid = isValidUrl(url)
  const hasUrl = !!(url && url.trim())

  return (
    <div
      className={`group relative border rounded-lg overflow-hidden bg-white dark:bg-brand-900 ${
        hasError ? 'border-red-400' : 'border-brand-200 dark:border-brand-700'
      }`}
    >
      <div className="aspect-square relative bg-brand-100 dark:bg-brand-800/50 flex items-center justify-center">
        {hasUrl && valid && !loadError ? (
          <img
            src={url}
            alt={`ภาพที่ ${index + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setLoadError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-brand-400 dark:text-brand-500">
            <ImageIcon className="w-7 h-7" />
            <span className="text-[10px] font-medium">
              {hasUrl ? (valid ? 'โหลดไม่ได้' : 'URL ไม่ถูกต้อง') : `ช่อง ${index + 1}`}
            </span>
          </div>
        )}
        {hasUrl && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
            title="ลบรูปนี้"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <input
        type="url"
        className="w-full text-[11px] font-mono px-2 py-1.5 border-t border-brand-200 dark:border-brand-700 bg-white dark:bg-brand-900 text-brand-900 dark:text-brand-100 focus:outline-none focus:bg-brand-50 dark:focus:bg-brand-950"
        placeholder={`URL ${index + 1}`}
        value={url}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

/**
 * Read-only thumbnail strip used inside DataTable cells.
 * Renders up to 3 thumbnails + a "+N" badge for the rest.
 */
export function ImageGalleryCell({ value }) {
  const urls = parseImageGalleryValue(value)
  if (urls.length === 0) {
    return <span className="text-brand-400 italic text-xs">—</span>
  }
  const visible = urls.slice(0, 3)
  const overflow = urls.length - visible.length
  return (
    <div className="inline-flex items-center gap-1 align-middle">
      {visible.map((u, i) => (
        <img
          key={i}
          src={u}
          alt=""
          className="w-8 h-8 rounded object-cover border border-brand-200 dark:border-brand-700 bg-brand-100 dark:bg-brand-800"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.visibility = 'hidden'
          }}
        />
      ))}
      {overflow > 0 && (
        <span className="badge bg-brand-100 dark:bg-brand-800 text-brand-700 dark:text-brand-300 !text-[10px] !px-1.5">
          +{overflow}
        </span>
      )}
    </div>
  )
}
