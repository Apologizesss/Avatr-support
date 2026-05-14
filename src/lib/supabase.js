import { createClient } from '@supabase/supabase-js'

const STORAGE_KEY = 'avatr_admin_supabase_config'

// ---------------- Env-var credentials (primary source) ----------------
// Vite bakes these into the build at compile time.
// Set them in Vercel: Project Settings → Environment Variables
//   VITE_SUPABASE_URL       = https://xxx.supabase.co
//   VITE_SUPABASE_ANON_KEY  = eyJ...
const ENV_URL = import.meta.env.VITE_SUPABASE_URL
const ENV_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const HAS_ENV_CONFIG = !!(ENV_URL && ENV_KEY)

/**
 * Returns the Supabase config.
 * Priority:
 *   1. Environment variables (production — baked into build)
 *   2. localStorage (dev fallback — set via the Setup page)
 * Returns null if neither is available.
 */
export function getSupabaseConfig() {
  if (HAS_ENV_CONFIG) {
    return { url: ENV_URL, anonKey: ENV_KEY, source: 'env' }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const cfg = JSON.parse(raw)
    if (!cfg.url || !cfg.anonKey) return null
    return { ...cfg, source: 'localStorage' }
  } catch {
    return null
  }
}

/**
 * Save credentials to localStorage (dev mode only).
 * When env vars are set, this is a no-op because they take priority.
 */
export function saveSupabaseConfig({ url, anonKey }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, anonKey }))
  _client = null
}

/**
 * Clear localStorage credentials.
 * When env vars are set, the app will still work using env vars.
 */
export function clearSupabaseConfig() {
  localStorage.removeItem(STORAGE_KEY)
  _client = null
}

/**
 * Whether credentials are coming from env vars (production mode).
 * Used by the UI to hide the "change credentials" button.
 */
export function isUsingEnvConfig() {
  return HAS_ENV_CONFIG
}

let _client = null

export function getClient() {
  if (_client) return _client
  const cfg = getSupabaseConfig()
  if (!cfg) throw new Error('Supabase not configured')
  _client = createClient(cfg.url, cfg.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'avatr_admin_auth',
    },
  })
  return _client
}

/**
 * Test connection using the auth settings endpoint (accepts anon key).
 */
export async function testConnection({ url, anonKey }) {
  try {
    const base = url.replace(/\/$/, '')
    const res = await fetch(`${base}/auth/v1/settings`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    })
    if (res.ok) return { ok: true, status: res.status }
    return {
      ok: false,
      status: res.status,
      error:
        res.status === 401
          ? 'API Key ไม่ถูกต้อง หรือไม่ได้ใช้ anon public key'
          : `HTTP ${res.status}`,
    }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

export async function uploadImage(bucket, tableName, rowId, file) {
  const supabase = getClient()
  const fileName = `${crypto.randomUUID()}-${file.name}`
  const path = `${tableName}/${rowId}/${fileName}`
  const { data, error } = await supabase.storage.from(bucket).upload(path, file)
  if (error) throw error
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return { path: data.path, publicUrl: urlData.publicUrl }
}

export async function insertImageMapping({
  tableName,
  rowId,
  bucket,
  path,
  publicUrl,
  metadata = {},
  uploadedBy = null,
}) {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('images')
    .insert([
      {
        table_name: tableName,
        row_id: String(rowId),
        bucket,
        path,
        public_url: publicUrl,
        metadata,
        uploaded_by: uploadedBy,
      },
    ])
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deleteImageFileAndMapping({
  tableName,
  rowId,
  bucket,
  path,
}) {
  const supabase = getClient()

  if (bucket && path) {
    const { error: storageError } = await supabase.storage.from(bucket).remove([path])
    if (storageError) throw storageError
  }

  const { error: mapError } = await supabase
    .from('images')
    .delete()
    .eq('table_name', tableName)
    .eq('row_id', String(rowId))
    .eq('path', path)

  if (mapError) throw mapError
}
