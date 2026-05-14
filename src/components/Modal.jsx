import { useEffect } from 'react'
import { X } from 'lucide-react'

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }[size]

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${sizeClass} max-h-[90vh] bg-white dark:bg-brand-900 rounded-xl shadow-2xl border border-brand-200 dark:border-brand-800 flex flex-col animate-slide-up`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-200 dark:border-brand-800">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-brand-200 dark:border-brand-800 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
