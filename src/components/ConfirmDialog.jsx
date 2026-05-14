import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Spinner } from './Spinner'

/**
 * ConfirmDialog with optional "type to confirm" safety step.
 *
 * Props:
 *   isOpen         : bool
 *   onCancel       : () => void
 *   onConfirm      : () => void
 *   title          : string
 *   message        : ReactNode
 *   confirmLabel   : string (default "ยืนยัน")
 *   danger         : bool (default false) — red styling
 *   requireTyping  : string | null — user must type this exact string to enable confirm
 *   submitting     : bool
 */
export function ConfirmDialog({
  isOpen,
  onCancel,
  onConfirm,
  title,
  message,
  confirmLabel = 'ยืนยัน',
  danger = false,
  requireTyping = null,
  submitting = false,
}) {
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (!isOpen) setTyped('')
  }, [isOpen])

  const canConfirm = !requireTyping || typed.trim() === requireTyping

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !submitting && onCancel()}
      title={title}
      size="sm"
      footer={
        <>
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            ยกเลิก
          </button>
          <button
            className={danger ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={onConfirm}
            disabled={!canConfirm || submitting}
          >
            {submitting && <Spinner className="w-4 h-4" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        {danger && (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 text-sm text-brand-700 dark:text-brand-300">
          {message}
        </div>
      </div>

      {requireTyping && (
        <div className="mt-4">
          <label className="block text-xs font-semibold mb-1.5 text-brand-700 dark:text-brand-300">
            พิมพ์{' '}
            <code className="px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-800 text-xs font-mono text-red-600 dark:text-red-400">
              {requireTyping}
            </code>{' '}
            เพื่อยืนยัน
          </label>
          <input
            type="text"
            className="input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoFocus
            disabled={submitting}
          />
        </div>
      )}
    </Modal>
  )
}
