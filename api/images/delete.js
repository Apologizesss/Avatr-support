import { createClient } from '@supabase/supabase-js'

function getServerConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null
  return { url, serviceRoleKey }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  const cfg = getServerConfig()
  if (!cfg) {
    res.status(500).json({ ok: false, error: 'Server delete is not configured' })
    return
  }

  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) {
      res.status(401).json({ ok: false, error: 'Missing auth token' })
      return
    }

    const { tableName, rowId, bucket, path } = req.body || {}
    if (!tableName || !rowId || !bucket || !path) {
      res.status(400).json({ ok: false, error: 'Missing delete payload' })
      return
    }

    const supabase = createClient(cfg.url, cfg.serviceRoleKey)
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData?.user) {
      res.status(401).json({ ok: false, error: 'Invalid session' })
      return
    }

    const { error: storageError } = await supabase.storage.from(bucket).remove([path])
    if (storageError) {
      res.status(400).json({ ok: false, error: storageError.message })
      return
    }

    const { error: deleteError } = await supabase
      .from('images')
      .delete()
      .eq('table_name', tableName)
      .eq('row_id', String(rowId))
      .eq('path', path)

    if (deleteError) {
      res.status(400).json({ ok: false, error: deleteError.message })
      return
    }

    res.status(200).json({ ok: true })
  } catch (error) {
    res.status(500).json({ ok: false, error: error?.message || 'Delete failed' })
  }
}