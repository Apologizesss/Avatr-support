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
    res.status(500).json({ ok: false, error: 'Server upload is not configured' })
    return
  }

  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) {
      res.status(401).json({ ok: false, error: 'Missing auth token' })
      return
    }

    const { bucket, tableName, rowId, fileName, mimeType, base64 } = req.body || {}
    if (!bucket || !tableName || !rowId || !fileName || !base64) {
      res.status(400).json({ ok: false, error: 'Missing upload payload' })
      return
    }

    const supabase = createClient(cfg.url, cfg.serviceRoleKey)
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData?.user) {
      res.status(401).json({ ok: false, error: 'Invalid session' })
      return
    }

    const fileBuffer = Buffer.from(String(base64), 'base64')
    const path = `${tableName}/${rowId}/${crypto.randomUUID()}-${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, fileBuffer, { contentType: mimeType || 'application/octet-stream', upsert: false })

    if (uploadError) {
      res.status(400).json({ ok: false, error: uploadError.message })
      return
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)

    const { error: insertError } = await supabase.from('images').insert([
      {
        table_name: tableName,
        row_id: String(rowId),
        bucket,
        path,
        public_url: urlData.publicUrl,
        metadata: {
          name: fileName,
          type: mimeType || 'application/octet-stream',
        },
        uploaded_by: userData.user.email || '',
      },
    ])

    if (insertError) {
      await supabase.storage.from(bucket).remove([path])
      res.status(400).json({ ok: false, error: insertError.message })
      return
    }

    res.status(200).json({ ok: true, data: { path, publicUrl: urlData.publicUrl } })
  } catch (error) {
    res.status(500).json({ ok: false, error: error?.message || 'Upload failed' })
  }
}