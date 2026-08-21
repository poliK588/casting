-- Migration: Restrict authenticated INSERT on public.media to exact frontend columns
--
-- Previously: GRANT SELECT, INSERT ON public.media TO authenticated  (table-level INSERT)
-- After:      INSERT restricted to 14 specific columns the frontend actually writes.
--
-- Does NOT touch: SELECT, UPDATE(is_primary), anon, service_role, postgres, RLS policies.

-- Step 1: Revoke table-level INSERT from authenticated.
--         (SELECT is unaffected because REVOKE INSERT does not touch other privileges.)
REVOKE INSERT ON public.media FROM authenticated;

-- Step 2: Grant column-level INSERT on only the 14 frontend-required columns.
GRANT INSERT (
  profile_id,
  url,
  storage_path,
  type,
  provider,
  bucket_id,
  status,
  access_level,
  ai_usage_scope,
  mime_type,
  original_filename,
  file_size_bytes,
  is_primary,
  display_order
) ON public.media TO authenticated;
