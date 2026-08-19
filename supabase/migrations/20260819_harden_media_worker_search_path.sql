-- =============================================================================
-- Migration: Harden invoke_media_deletion_worker search_path
--
-- Narrows the LIVE function's search_path from (public, vault, net, pg_temp)
-- to (pg_catalog, pg_temp), matching the definition already committed in
-- 20260817_media_storage_and_worker_scheduler.sql.
--
-- Safe because the function body already uses fully-qualified references:
--   vault.decrypted_secrets, net.http_post
-- =============================================================================

BEGIN;

ALTER FUNCTION public.invoke_media_deletion_worker()
  SET search_path = pg_catalog, pg_temp;

COMMIT;
