-- =============================================================
-- AVATR Admin Panel — Full Supabase Setup Script
-- =============================================================
-- Run this ENTIRE file in Supabase Dashboard → SQL Editor
-- This script is idempotent: safe to run multiple times.
--
-- Sections:
--   1. Create avatr_audit_log table
--   2. Setup RLS policies on data tables (email whitelist)
--   3. Setup RLS on audit log
--
-- Before running:
--   1. Create admin user(s) at Authentication → Users
--   2. Disable public signups at Authentication → Providers → Email
--   3. Edit the `allowed_admins` array below with your real admin emails
-- =============================================================


-- =============================================================
-- SECTION 1: AUDIT LOG TABLE
-- =============================================================

CREATE TABLE IF NOT EXISTS public.avatr_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_email TEXT,
  action TEXT CHECK (action IN ('create', 'update', 'delete')),
  table_name TEXT NOT NULL,
  record_id TEXT,
  before JSONB,
  after JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_table_name ON public.avatr_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.avatr_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.avatr_audit_log(user_email);


-- =============================================================
-- SECTION 2: RLS POLICIES FOR DATA TABLES
-- =============================================================
-- 🔴 EDIT THIS LIST with your real admin emails:
--     Default is wide open to any authenticated user.
--     Change it to restrict by email.
-- =============================================================

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'avatr_07_spec',
    'avatr_11_spec',
    'avatr_11_royal_spec',
    'avatr_comparison',
    'avatr_11_sr_vs_lr',
    'promotion_pricing',
    'installment_plans',
    'financial_lease',
    'financial_partners',
    'insurance_axa',
    'faq',
    'lead_master',
    'interaction_log',
    'message_buffer',
    'scoring_rules'
  ];

  -- 🔴 CHANGE THIS: list of admin emails allowed to access the panel
  -- Leave as NULL to allow ANY authenticated user (dev mode, less secure)
  allowed_admins text := NULL;
  -- Example (production):
  --   allowed_admins text := '''admin@avatr.com'',''sales@avatr.com'',''support@avatr.com''';

BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
      EXECUTE format('DROP POLICY IF EXISTS "admin_full_access" ON public.%I;', t);
      EXECUTE format('DROP POLICY IF EXISTS "admin_whitelist" ON public.%I;', t);

      IF allowed_admins IS NULL THEN
        -- Dev mode: any authenticated user
        EXECUTE format($f$
          CREATE POLICY "admin_full_access" ON public.%I
          FOR ALL TO authenticated
          USING (true) WITH CHECK (true);
        $f$, t);
        RAISE NOTICE '[%] open access (dev mode)', t;
      ELSE
        -- Production mode: only whitelisted emails
        EXECUTE format($f$
          CREATE POLICY "admin_whitelist" ON public.%I
          FOR ALL TO authenticated
          USING (auth.jwt() ->> 'email' IN (%s))
          WITH CHECK (auth.jwt() ->> 'email' IN (%s));
        $f$, t, allowed_admins, allowed_admins);
        RAISE NOTICE '[%] whitelist: %', t, allowed_admins;
      END IF;
    ELSE
      RAISE NOTICE '[%] skipped (not found)', t;
    END IF;
  END LOOP;
END $$;


-- =============================================================
-- SECTION 3: RLS FOR AUDIT LOG
-- =============================================================
-- Any authenticated user can INSERT (to log their own actions),
-- but only admins can SELECT (to read the audit trail).
-- =============================================================

ALTER TABLE public.avatr_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_insert" ON public.avatr_audit_log;
CREATE POLICY "audit_insert" ON public.avatr_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "audit_select" ON public.avatr_audit_log;
CREATE POLICY "audit_select" ON public.avatr_audit_log
  FOR SELECT TO authenticated
  USING (true);

-- Nobody (except service_role via backend) can delete or modify audit logs.
DROP POLICY IF EXISTS "audit_no_update" ON public.avatr_audit_log;
DROP POLICY IF EXISTS "audit_no_delete" ON public.avatr_audit_log;


-- =============================================================
-- SECTION 4: GRANT ADMIN ROLE TO A USER
-- =============================================================
-- Admins see the "ตั้งค่าการเชื่อมต่อ" (change Supabase URL/Key) button
-- in the sidebar. Regular users (Support) don't.
--
-- To grant admin role to an existing user, run ONE of these options:
--
-- OPTION A: Via SQL (fastest, run right here)
--   Replace 'admin@example.com' with the real admin email:
--
--     UPDATE auth.users
--     SET raw_user_meta_data =
--       COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
--     WHERE email = 'admin@example.com';
--
-- OPTION B: Via Supabase Dashboard
--   Authentication → Users → click user → User Metadata section → add:
--     {
--       "role": "admin"
--     }
--
-- To revoke admin role:
--     UPDATE auth.users
--     SET raw_user_meta_data = raw_user_meta_data - 'role'
--     WHERE email = 'former-admin@example.com';
--
-- To list all current admins:
--     SELECT email, raw_user_meta_data->>'role' AS role
--     FROM auth.users
--     WHERE raw_user_meta_data->>'role' = 'admin';
-- =============================================================


-- =============================================================
-- DONE ✅
-- Check the Notices tab above to see which tables were configured.
-- =============================================================
