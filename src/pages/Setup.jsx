import { useState } from 'react'
import {
  Database,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lock,
} from 'lucide-react'
import { saveSupabaseConfig, testConnection } from '../lib/supabase'
import { Spinner } from '../components/Spinner'

export function Setup({ onDone }) {
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState(null)
  const [showHelp, setShowHelp] = useState(false)

  const isValid = url.trim().startsWith('http') && anonKey.trim().length > 20

  const handleTest = async () => {
    setTesting(true)
    setResult(null)
    const r = await testConnection({ url: url.trim(), anonKey: anonKey.trim() })
    setResult(r)
    setTesting(false)
  }

  const handleSave = () => {
    saveSupabaseConfig({ url: url.trim(), anonKey: anonKey.trim() })
    onDone()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-900 dark:bg-brand-100 text-white dark:text-brand-950 mb-4">
            <Database className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">ตั้งค่าเริ่มต้น</h1>
          <p className="text-brand-600 dark:text-brand-400 mt-2 text-sm">
            กรอกข้อมูลสำหรับเชื่อมต่อกับ Supabase (ครั้งเดียวเท่านั้น)
          </p>
        </div>

        <div className="card p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Supabase URL
              <span className="text-xs font-normal text-brand-500 ml-2">(ขึ้นต้นด้วย https://)</span>
            </label>
            <input
              type="url"
              className="input font-mono text-sm"
              placeholder="https://xxxxxxxxxxxx.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Anon Public Key
              <span className="text-xs font-normal text-brand-500 ml-2">(token ยาวๆ ขึ้นต้นด้วย eyJ)</span>
            </label>
            <input
              type="password"
              className="input font-mono text-sm"
              placeholder="eyJhbGciOi..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowHelp((s) => !s)}
              className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 mt-1 flex items-center gap-1 py-2 -my-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              หาข้อมูลนี้ได้ที่ไหน?
            </button>
          </div>

          {showHelp && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-4 text-sm text-blue-900 dark:text-blue-100 animate-slide-up">
              <p className="font-semibold mb-2 flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4" />
                วิธีหา Supabase URL และ Key
              </p>
              <ol className="list-decimal list-inside space-y-1 text-xs opacity-90">
                <li>เข้า <strong>app.supabase.com</strong> → เลือก project</li>
                <li>เมนูซ้าย → กด <strong>Settings</strong> (รูปเฟือง) → <strong>API</strong></li>
                <li>คัดลอก <strong>Project URL</strong> มาใส่ช่องแรก</li>
                <li>คัดลอก <strong>anon public key</strong> (ไม่ใช่ service_role!) มาใส่ช่องที่สอง</li>
              </ol>
            </div>
          )}

          {result && (
            <div
              className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${
                result.ok
                  ? 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100'
                  : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100'
              }`}
            >
              {result.ok ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium">
                  {result.ok ? 'เชื่อมต่อสำเร็จ' : 'เชื่อมต่อไม่ได้'}
                </p>
                <p className="text-xs mt-0.5 opacity-80">
                  {result.ok
                    ? 'ทุกอย่างพร้อมใช้งาน กดบันทึกเพื่อไปหน้า Login'
                    : result.error || `HTTP ${result.status} — ลองตรวจสอบ URL และ Key อีกครั้ง`}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              className="btn btn-secondary flex-1"
              onClick={handleTest}
              disabled={!isValid || testing}
            >
              {testing && <Spinner className="w-4 h-4" />}
              ทดสอบการเชื่อมต่อ
            </button>
            <button
              className="btn btn-primary flex-1"
              onClick={handleSave}
              disabled={!isValid}
            >
              บันทึกและเริ่มใช้งาน
            </button>
          </div>
        </div>

        <div className="mt-6 card p-4 text-xs text-brand-600 dark:text-brand-400 flex items-start gap-2.5">
          <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-brand-500" />
          <p>
            <strong className="text-brand-700 dark:text-brand-300">ปลอดภัย:</strong> URL และ Key จะถูกเก็บใน browser ของคุณเท่านั้น
            ไม่มีการส่งไปที่อื่น · สามารถเปลี่ยนได้ในหน้า Login
          </p>
        </div>
      </div>
    </div>
  )
}
