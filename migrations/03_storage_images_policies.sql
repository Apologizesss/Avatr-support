-- =============================================================
-- AVATR Admin — Storage + Images RLS Policies (Full Customization)
-- =============================================================
-- Run this file in Supabase SQL Editor after:
--   1) creating bucket `avatr-images`
--   2) running migrations/02_create_images_table.sql
--
-- What this script configures:
--   - public.images table RLS (SELECT/INSERT/DELETE)
--   - storage.objects RLS for target bucket (SELECT/INSERT/UPDATE/DELETE)
--   - config table so you can change behavior without rewriting policies
--
-- Notes:
--   - This script is idempotent (safe to re-run)
--   - Uses email-based admin/whitelist controls via auth.jwt() ->> 'email'
-- =============================================================

-- -------------------------------------------------------------
-- 1) Config table (single row)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_storage_policy_config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  bucket_name TEXT NOT NULL DEFAULT 'avatr-images',

  -- Read controls
  allow_public_read BOOLEAN NOT NULL DEFAULT false,
  allow_authenticated_read BOOLEAN NOT NULL DEFAULT true,

  -- Write controls
  allow_authenticated_insert BOOLEAN NOT NULL DEFAULT true,
  allow_authenticated_delete BOOLEAN NOT NULL DEFAULT true,

  -- If true: INSERT/DELETE require email whitelist/admin, regardless of allow_authenticated_*
  strict_whitelist BOOLEAN NOT NULL DEFAULT false,

  -- Optional allow-lists
  admin_emails TEXT[] NOT NULL DEFAULT '{}',
  uploader_emails TEXT[] NOT NULL DEFAULT '{}',

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.app_storage_policy_config (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Keep config timestamp fresh
CREATE OR REPLACE FUNCTION public.fn_touch_storage_policy_config_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_storage_policy_config_updated_at ON public.app_storage_policy_config;
CREATE TRIGGER trg_touch_storage_policy_config_updated_at
BEFORE UPDATE ON public.app_storage_policy_config
FOR EACH ROW
EXECUTE FUNCTION public.fn_touch_storage_policy_config_updated_at();


-- -------------------------------------------------------------
-- 2) Helper functions
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(auth.jwt() ->> 'email', '');
$$;

CREATE OR REPLACE FUNCTION public.current_bucket_name()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bucket_name FROM public.app_storage_policy_config WHERE id = 1;
$$;

CREATE OR REPLACE FUNCTION public.storage_allow_public_read()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT allow_public_read FROM public.app_storage_policy_config WHERE id = 1;
$$;

CREATE OR REPLACE FUNCTION public.storage_allow_authenticated_read()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT allow_authenticated_read FROM public.app_storage_policy_config WHERE id = 1;
$$;

CREATE OR REPLACE FUNCTION public.storage_allow_authenticated_insert()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT allow_authenticated_insert FROM public.app_storage_policy_config WHERE id = 1;
$$;

CREATE OR REPLACE FUNCTION public.storage_allow_authenticated_delete()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT allow_authenticated_delete FROM public.app_storage_policy_config WHERE id = 1;
$$;

CREATE OR REPLACE FUNCTION public.storage_strict_whitelist()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT strict_whitelist FROM public.app_storage_policy_config WHERE id = 1;
$$;

CREATE OR REPLACE FUNCTION public.is_storage_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_email() = ANY(admin_emails)
  FROM public.app_storage_policy_config
  WHERE id = 1;
$$;

CREATE OR REPLACE FUNCTION public.is_storage_uploader_whitelisted()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.current_user_email() = ANY(uploader_emails)
    OR public.current_user_email() = ANY(admin_emails)
  )
  FROM public.app_storage_policy_config
  WHERE id = 1;
$$;

CREATE OR REPLACE FUNCTION public.can_storage_insert()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN strict_whitelist THEN public.is_storage_uploader_whitelisted()
    ELSE allow_authenticated_insert OR public.is_storage_admin()
  END
  FROM public.app_storage_policy_config
  WHERE id = 1;
$$;

CREATE OR REPLACE FUNCTION public.can_storage_delete()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN strict_whitelist THEN public.is_storage_uploader_whitelisted()
    ELSE allow_authenticated_delete OR public.is_storage_admin()
  END
  FROM public.app_storage_policy_config
  WHERE id = 1;
$$;


-- -------------------------------------------------------------
-- 3) images table RLS
-- -------------------------------------------------------------
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Auto-fill uploaded_by when missing
CREATE OR REPLACE FUNCTION public.fn_images_set_uploaded_by()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.uploaded_by IS NULL OR NEW.uploaded_by = '' THEN
    NEW.uploaded_by := public.current_user_email();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_images_set_uploaded_by ON public.images;
CREATE TRIGGER trg_images_set_uploaded_by
BEFORE INSERT ON public.images
FOR EACH ROW
EXECUTE FUNCTION public.fn_images_set_uploaded_by();

DROP POLICY IF EXISTS images_select_policy ON public.images;
CREATE POLICY images_select_policy
ON public.images
FOR SELECT
TO authenticated
USING (
  bucket = public.current_bucket_name()
  AND (
    public.storage_allow_authenticated_read()
    OR public.is_storage_admin()
  )
);

DROP POLICY IF EXISTS images_insert_policy ON public.images;
CREATE POLICY images_insert_policy
ON public.images
FOR INSERT
TO authenticated
WITH CHECK (
  bucket = public.current_bucket_name()
  AND public.can_storage_insert()
);

DROP POLICY IF EXISTS images_delete_policy ON public.images;
CREATE POLICY images_delete_policy
ON public.images
FOR DELETE
TO authenticated
USING (
  bucket = public.current_bucket_name()
  AND (
    public.can_storage_delete()
    OR uploaded_by = public.current_user_email()
    OR public.is_storage_admin()
  )
);


-- -------------------------------------------------------------
-- 4) storage.objects policies for configured bucket
-- -------------------------------------------------------------
-- Supabase storage table already exists in schema `storage`.

DROP POLICY IF EXISTS storage_read_public ON storage.objects;
CREATE POLICY storage_read_public
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = public.current_bucket_name()
  AND public.storage_allow_public_read()
);

DROP POLICY IF EXISTS storage_read_authenticated ON storage.objects;
CREATE POLICY storage_read_authenticated
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = public.current_bucket_name()
  AND (
    public.storage_allow_authenticated_read()
    OR public.is_storage_admin()
  )
);

DROP POLICY IF EXISTS storage_insert_authenticated ON storage.objects;
CREATE POLICY storage_insert_authenticated
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = public.current_bucket_name()
  AND public.can_storage_insert()
);

DROP POLICY IF EXISTS storage_update_authenticated ON storage.objects;
CREATE POLICY storage_update_authenticated
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = public.current_bucket_name()
  AND (
    public.can_storage_delete()
    OR owner = auth.uid()
    OR public.is_storage_admin()
  )
)
WITH CHECK (
  bucket_id = public.current_bucket_name()
  AND public.can_storage_insert()
);

DROP POLICY IF EXISTS storage_delete_authenticated ON storage.objects;
CREATE POLICY storage_delete_authenticated
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = public.current_bucket_name()
  AND (
    public.can_storage_delete()
    OR owner = auth.uid()
    OR public.is_storage_admin()
  )
);


-- -------------------------------------------------------------
-- 5) Recommended initial configuration (EDIT THIS)
-- -------------------------------------------------------------
-- Example:
-- UPDATE public.app_storage_policy_config
-- SET
--   bucket_name = 'avatr-images',
--   allow_public_read = true,
--   allow_authenticated_read = true,
--   allow_authenticated_insert = true,
--   allow_authenticated_delete = true,
--   strict_whitelist = false,
--   admin_emails = ARRAY['admin@example.com'],
--   uploader_emails = ARRAY['support@example.com']
-- WHERE id = 1;


-- -------------------------------------------------------------
-- 6) Quick diagnostics
-- -------------------------------------------------------------
-- SELECT * FROM public.app_storage_policy_config;
-- SELECT public.current_user_email(), public.is_storage_admin(), public.can_storage_insert(), public.can_storage_delete();

-- =============================================================
-- DONE
-- =============================================================
