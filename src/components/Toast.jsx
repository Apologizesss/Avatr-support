import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react'

// Simple toast system via custom events. Anywhere in the app can call:
//   window.dispatchEvent(new CustomEvent('toast', { detail: { type, message } }))

export function toast(type, message) {
  window.dispatchEvent(new CustomEvent('toast', { detail: { type, message } }))
}

export function ToastContainer() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const handler = (e) => {
      const id = Math.random().toString(36).slice(2)
      const item = { id, ...e.detail }
      setItems((prev) => [...prev, item])
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== id))
      }, 4000)
    }
    window.addEventListener('toast', handler)
    return () => window.removeEventListener('toast', handler)
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {items.map((item) => (
        <ToastItem key={item.id} {...item} />
      ))}
    </div>
  )
}

function ToastItem({ type, message }) {
  const config = {
    success: {
      icon: CheckCircle2,
      className:
        'bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100',
    },
    error: {
      icon: XCircle,
      className:
        'bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100',
    },
    warning: {
      icon: AlertCircle,
      className:
        'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100',
    },
    info: {
      icon: Info,
      className:
        'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100',
    },
  }[type || 'info']

  const Icon = config.icon

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2 px-4 py-3 rounded-lg border shadow-lg max-w-sm animate-slide-up ${config.className}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="text-sm font-medium">{message}</div>
    </div>
  )
}
