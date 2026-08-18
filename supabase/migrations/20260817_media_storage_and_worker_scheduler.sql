-- =============================================================================
-- Migration: Media Storage Buckets & Deletion Worker Scheduler
--
-- Captures live database/storage changes made after
-- 20260812_media_soft_delete_pipeline.sql:
--   1. Enable pg_cron, pg_net, supabase_vault extensions
--   2. Make public.media.url nullable
--   3. Create invoke_media_deletion_worker() RPC
--   4. Schedule the cron job (idempotent)
--   5. Create storage buckets (idempotent via ON CONFLICT)
--   6. Create storage RLS policies (idempotent via DROP IF EXISTS + CREATE)
--
-- NOTE: This migration does NOT create or populate Vault secrets.
--       The following secrets must be provisioned per-environment
--       via the Supabase Dashboard or CLI BEFORE the cron job fires:
--         - media_deletion_worker_url
--         - media_deletion_worker_secret
-- =============================================================================

BEGIN;

-- =========================================================================
-- 1. EXTENSIONS (safe — IF NOT EXISTS prevents errors on re-run)
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- =========================================================================
-- 2. MAKE public.media.url NULLABLE
--    (DROP NOT NULL is a no-op if the column is already nullable)
-- =========================================================================

ALTER TABLE public.media
  ALTER COLUMN url DROP NOT NULL;

-- =========================================================================
-- 3. FUNCTION: public.invoke_media_deletion_worker()
--
--    Reads the Edge Function URL and shared secret from Vault,
--    then fires an async HTTP POST via pg_net.
--    Returns the pg_net request_id for observability.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.invoke_media_deletion_worker()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    v_url    text;
    v_secret text;
    v_request_id bigint;
BEGIN
    -- Read the worker URL from Vault
    SELECT decrypted_secret INTO v_url
    FROM vault.decrypted_secrets
    WHERE name = 'media_deletion_worker_url'
    LIMIT 1;

    -- Read the shared secret from Vault
    SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets
    WHERE name = 'media_deletion_worker_secret'
    LIMIT 1;

    -- Guard: both secrets must be present
    IF v_url IS NULL OR v_secret IS NULL THEN
        RAISE EXCEPTION 'Media deletion worker Vault secrets are missing';
    END IF;

    -- Fire async POST to the Edge Function
    SELECT net.http_post(
        url     := v_url,
        headers := jsonb_build_object(
            'Content-Type',    'application/json',
            'x-worker-secret', v_secret
        ),
        body    := '{}'::jsonb
    ) INTO v_request_id;

    RETURN v_request_id;
END;
$$;

-- Lock down access: only service_role may invoke this function
REVOKE ALL ON FUNCTION public.invoke_media_deletion_worker() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.invoke_media_deletion_worker() FROM anon;
REVOKE ALL ON FUNCTION public.invoke_media_deletion_worker() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.invoke_media_deletion_worker() TO service_role;

-- =========================================================================
-- 4. CRON JOB: process-media-deletions-every-minute
--
--    Idempotent: if the job already exists, update it in place;
--    otherwise create it. Never assumes a fixed jobid.
-- =========================================================================

DO $$
DECLARE
    v_jobid bigint;
BEGIN
    -- Check whether the job already exists
    SELECT jobid INTO v_jobid
    FROM cron.job
    WHERE jobname = 'process-media-deletions-every-minute'
    LIMIT 1;

    IF v_jobid IS NULL THEN
        -- Job does not exist — create it
        PERFORM cron.schedule(
            'process-media-deletions-every-minute',
            '* * * * *',
            'SELECT public.invoke_media_deletion_worker();'
        );
    ELSE
        -- Job already exists — converge schedule, command, and active flag
        PERFORM cron.alter_job(
            job_id   := v_jobid,
            schedule := '* * * * *',
            command  := 'SELECT public.invoke_media_deletion_worker();',
            active   := true
        );
    END IF;
END;
$$;

-- =========================================================================
-- 5. STORAGE BUCKETS (idempotent via INSERT ... ON CONFLICT DO UPDATE)
--
--    Converges existing buckets to the required configuration
--    without touching any objects already stored inside them.
-- =========================================================================

-- talent-images: public bucket for profile/portfolio images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'talent-images',
    'talent-images',
    true,
    20971520,                -- 20 MB
    ARRAY['image/*']
)
ON CONFLICT (id) DO UPDATE SET
    public             = EXCLUDED.public,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- talent-videos: private bucket for portfolio videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'talent-videos',
    'talent-videos',
    false,
    524288000,               -- 500 MB
    ARRAY['video/*']
)
ON CONFLICT (id) DO UPDATE SET
    public             = EXCLUDED.public,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- talent-audio: private bucket for portfolio audio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'talent-audio',
    'talent-audio',
    false,
    104857600,               -- 100 MB
    ARRAY['audio/*']
)
ON CONFLICT (id) DO UPDATE SET
    public             = EXCLUDED.public,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =========================================================================
-- 6. STORAGE RLS POLICIES
--
--    9 policies total (INSERT, SELECT, DELETE for each of the 3 buckets).
--    DROP IF EXISTS + CREATE ensures idempotent re-runs.
--    No UPDATE policies are created.
-- =========================================================================

-- ── talent-images ──

DROP POLICY IF EXISTS "Talent can upload own images" ON storage.objects;
CREATE POLICY "Talent can upload own images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'talent-images'
        AND owner_id = auth.uid()::text
    );

DROP POLICY IF EXISTS "Talent can read own images" ON storage.objects;
CREATE POLICY "Talent can read own images"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'talent-images'
        AND owner_id = auth.uid()::text
    );

DROP POLICY IF EXISTS "Talent can delete own images" ON storage.objects;
CREATE POLICY "Talent can delete own images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'talent-images'
        AND owner_id = auth.uid()::text
    );

-- ── talent-videos ──

DROP POLICY IF EXISTS "Talent can upload own videos" ON storage.objects;
CREATE POLICY "Talent can upload own videos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'talent-videos'
        AND owner_id = auth.uid()::text
    );

DROP POLICY IF EXISTS "Talent can read own videos" ON storage.objects;
CREATE POLICY "Talent can read own videos"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'talent-videos'
        AND owner_id = auth.uid()::text
    );

DROP POLICY IF EXISTS "Talent can delete own videos" ON storage.objects;
CREATE POLICY "Talent can delete own videos"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'talent-videos'
        AND owner_id = auth.uid()::text
    );

-- ── talent-audio ──

DROP POLICY IF EXISTS "Talent can upload own audio" ON storage.objects;
CREATE POLICY "Talent can upload own audio"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'talent-audio'
        AND owner_id = auth.uid()::text
    );

DROP POLICY IF EXISTS "Talent can read own audio" ON storage.objects;
CREATE POLICY "Talent can read own audio"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'talent-audio'
        AND owner_id = auth.uid()::text
    );

DROP POLICY IF EXISTS "Talent can delete own audio" ON storage.objects;
CREATE POLICY "Talent can delete own audio"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'talent-audio'
        AND owner_id = auth.uid()::text
    );

COMMIT;
