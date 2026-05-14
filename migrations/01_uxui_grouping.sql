-- =============================================================
-- AVATR Admin — UX/UI Redesign Migration #01
-- =============================================================
-- Adds columns required by the new "Phase 1+2+3 grouping" redesign.
--
-- Run in Supabase Dashboard → SQL Editor. Idempotent — safe to
-- re-run. Does NOT drop or modify any existing data.
--
-- After running, verify with:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'promotion_pricing'
--     AND column_name IN ('applies_to_model','applies_to_color','images');
-- =============================================================


-- -------------------------------------------------------------
-- 1. Image gallery columns (jsonb array of up to 5 URLs)
-- -------------------------------------------------------------
ALTER TABLE public.avatr_07_spec       ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.avatr_11_spec       ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.avatr_11_royal_spec ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.promotion_pricing   ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;


-- -------------------------------------------------------------
-- 2. Promotion / installment scope (applies_to_model + color)
--    Used by the new "group by car model" view.
-- -------------------------------------------------------------
ALTER TABLE public.promotion_pricing ADD COLUMN IF NOT EXISTS applies_to_model TEXT;
ALTER TABLE public.promotion_pricing ADD COLUMN IF NOT EXISTS applies_to_color TEXT;

ALTER TABLE public.installment_plans ADD COLUMN IF NOT EXISTS applies_to_model TEXT;
ALTER TABLE public.installment_plans ADD COLUMN IF NOT EXISTS applies_to_color TEXT;


-- -------------------------------------------------------------
-- 3. FAQ scope (split "general" vs per-car-model)
--    Default 'general' so existing rows stay visible.
-- -------------------------------------------------------------
ALTER TABLE public.faq ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'general';

-- Backfill any NULLs to 'general' (safety net)
UPDATE public.faq SET scope = 'general' WHERE scope IS NULL;

-- Optional check constraint — extend the IN-list as you add more models
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'faq_scope_check' AND conrelid = 'public.faq'::regclass
  ) THEN
    ALTER TABLE public.faq
      ADD CONSTRAINT faq_scope_check
      CHECK (scope IN ('general','avatr_07','avatr_11','avatr_11_royal'));
  END IF;
END $$;


-- -------------------------------------------------------------
-- 4. Interaction log — make sure line_user_id is indexable
--    (Chat view groups by this column.)
-- -------------------------------------------------------------
ALTER TABLE public.interaction_log ADD COLUMN IF NOT EXISTS line_user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_interaction_line_user
  ON public.interaction_log(line_user_id, timestamp DESC);


-- -------------------------------------------------------------
-- 5. Performance indexes for the new groupable columns
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_promotion_model_color
  ON public.promotion_pricing(applies_to_model, applies_to_color);

CREATE INDEX IF NOT EXISTS idx_installment_model_color
  ON public.installment_plans(applies_to_model, applies_to_color);

CREATE INDEX IF NOT EXISTS idx_faq_scope
  ON public.faq(scope);


-- =============================================================
-- DONE ✅
-- New columns are all OPTIONAL with safe defaults. Existing
-- rows render as "— ไม่ระบุ —" in the group-by view until you
-- fill them in.
-- =============================================================
