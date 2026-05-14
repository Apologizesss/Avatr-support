import { getClient } from './supabase'

// Records every CRUD operation to the `avatr_audit_log` table in Supabase.
// Falls back silently if the table doesn't exist yet (graceful degradation).
//
// Schema (run the SQL below in Supabase):
//
//   CREATE TABLE avatr_audit_log (
//     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     created_at TIMESTAMPTZ DEFAULT NOW(),
//     user_email TEXT,
//     action TEXT CHECK (action IN ('create','update','delete')),
//     table_name TEXT NOT NULL,
//     record_id TEXT,
//     before JSONB,
//     after JSONB
//   );

let auditTableAvailable = null // tri-state: null=unknown, true/false after first try

export async function logAudit({ action, tableName, recordId, before, after }) {
  if (auditTableAvailable === false) return // known to be missing
  try {
    const supabase = getClient()
    const { data: sessionData } = await supabase.auth.getSession()
    const email = sessionData?.session?.user?.email || 'unknown'

    const { error } = await supabase.from('avatr_audit_log').insert({
      user_email: email,
      action,
      table_name: tableName,
      record_id: recordId ? String(recordId) : null,
      before: before || null,
      after: after || null,
    })
    if (error) {
      // Table missing? Disable future attempts to avoid console noise.
      if (/does not exist|not found/i.test(error.message || '')) {
        auditTableAvailable = false
        console.warn(
          '[audit] avatr_audit_log table missing. Audit logging disabled. ' +
            'Create the table (see README) to enable audit trail.'
        )
      } else {
        console.warn('[audit] Failed to log:', error.message)
      }
    } else {
      auditTableAvailable = true
    }
  } catch (e) {
    console.warn('[audit]', e.message)
  }
}

export function isAuditAvailable() {
  return auditTableAvailable === true
}
