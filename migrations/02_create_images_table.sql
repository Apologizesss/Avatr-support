-- Create images mapping table for uploaded files
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  row_id TEXT NOT NULL,
  bucket TEXT NOT NULL,
  path TEXT NOT NULL,
  public_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_images_table_row ON public.images(table_name, row_id);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON public.images(created_at DESC);
