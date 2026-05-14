import { useEffect, useState } from 'react'
import { Lock, Mail, LogIn } from 'lucide-react'
import { Spinner } from '../components/Spinner'
import { toast } from '../components/Toast'
import { clearSupabaseConfig, isUsingEnvConfig } from '../lib/supabase'
import { friendlyError } from '../lib/errors'

export function Login({ onSignIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Admin shortcut: Ctrl+Shift+S to change Supabase credentials.
  // Disabled when credentials come from env vars (production mode).
  useEffect(() => {
    if (isUsingEnvConfig()) return
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleReconfigure()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSignIn(email.trim(), password)
      toast('success', 'เข้าสู่ระบบสำเร็จ')
    } catch (err) {
      toast('error', friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleReconfigure = () => {
    if (confirm('ต้องการเปลี่ยน Supabase credentials ใหม่ใช่ไหม?')) {
      clearSupabaseConfig()
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-900 dark:bg-brand-100 text-white dark:text-brand-950 mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">เข้าสู่ระบบ</h1>
          <p className="text-brand-600 dark:text-brand-400 mt-2 text-sm">
            AVATR Admin Panel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">อีเมล</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
              <input
                type="email"
                className="input pl-9"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
              <input
                type="password"
                className="input pl-9"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <Spinner className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            เข้าสู่ระบบ
          </button>
        </form>

        {!isUsingEnvConfig() && (
          <div className="mt-4 text-center">
            {/* Hidden for regular users — admins can trigger via Ctrl+Shift+S */}
            <button
              onClick={handleReconfigure}
              className="text-[10px] text-brand-400 hover:text-brand-600 dark:hover:text-brand-400 opacity-40 hover:opacity-100 transition-opacity"
              title="กด Ctrl+Shift+S เพื่อเปิดการตั้งค่า"
            >
              ·
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
