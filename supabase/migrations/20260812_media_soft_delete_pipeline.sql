-- =============================================================================
-- Migration: Media Soft-Delete Pipeline
-- Idempotent migration that converges an older database toward the current
-- media soft-delete architecture.
-- =============================================================================

BEGIN;

-- =========================================================================
-- 1. ADD NEW COLUMNS TO public.media (idempotent via IF NOT EXISTS)
-- =========================================================================

ALTER TABLE public.media ADD COLUMN IF NOT EXISTS provider                  text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS status                    text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS bucket_id                 text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS provider_upload_id        text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS provider_asset_id         text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS playback_id              text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS provider_status           text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS provider_error_code       text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS provider_error_message    text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS processing_progress       integer;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS poster_media_id           uuid;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS provider_poster_reference text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS access_level              text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS ai_usage_scope            text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS mime_type                 text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS original_filename         text;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS file_size_bytes           bigint;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS duration_seconds          numeric;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS width                     integer;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS height                    integer;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS processing_started_at     timestamptz;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS last_provider_sync_at     timestamptz;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS retry_count               integer DEFAULT 0;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS deleted_at                timestamptz;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS updated_at                timestamptz DEFAULT now();

-- =========================================================================
-- 2. BACKFILL EXISTING ROWS WHERE VALUES ARE NULL
-- =========================================================================

UPDATE public.media
SET
    provider       = COALESCE(provider, 'supabase'),
    status         = COALESCE(status, 'ready'),
    bucket_id      = COALESCE(bucket_id, 'avatars'),
    access_level   = COALESCE(access_level, 'public'),
    ai_usage_scope = COALESCE(ai_usage_scope,
        CASE
            WHEN type = 'image' THEN 'profile_search'
            ELSE 'none'
        END
    ),
    updated_at     = COALESCE(updated_at, now())
WHERE provider IS NULL
   OR status IS NULL
   OR bucket_id IS NULL
   OR access_level IS NULL
   OR ai_usage_scope IS NULL
   OR updated_at IS NULL;

-- =========================================================================
-- 3. CHECK CONSTRAINTS ON public.media (safe conditional creation)
-- =========================================================================

ALTER TABLE public.media DROP CONSTRAINT IF EXISTS media_type_check;
ALTER TABLE public.media ADD CONSTRAINT media_type_check
    CHECK (type IN ('image', 'video', 'audio'));

DO $$
BEGIN

    -- media_provider_check
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'media_provider_check' AND conrelid = 'public.media'::regclass
    ) THEN
        ALTER TABLE public.media ADD CONSTRAINT media_provider_check
            CHECK (provider IN ('supabase', 'cloudflare_stream', 'mux', 'external'));
    END IF;

    -- media_status_check
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'media_status_check' AND conrelid = 'public.media'::regclass
    ) THEN
        ALTER TABLE public.media ADD CONSTRAINT media_status_check
            CHECK (status IN (
                'created',
                'awaiting_upload',
                'uploading',
                'uploaded',
                'processing',
                'ready',
                'failed'
            ));
    END IF;

    -- media_access_level_check
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'media_access_level_check' AND conrelid = 'public.media'::regclass
    ) THEN
        ALTER TABLE public.media ADD CONSTRAINT media_access_level_check
            CHECK (access_level IN (
                'public',
                'platform',
                'restricted',
                'project',
                'private'
            ));
    END IF;

    -- media_ai_usage_scope_check
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'media_ai_usage_scope_check' AND conrelid = 'public.media'::regclass
    ) THEN
        ALTER TABLE public.media ADD CONSTRAINT media_ai_usage_scope_check
            CHECK (ai_usage_scope IN (
                'none',
                'profile_search',
                'project_only'
            ));
    END IF;
END
$$;

-- =========================================================================
-- 4. FOREIGN KEYS ON public.media
-- =========================================================================

DO $$
BEGIN
    -- media_profile_id_fkey (only create if missing)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'media_profile_id_fkey' AND conrelid = 'public.media'::regclass
    ) THEN
        ALTER TABLE public.media ADD CONSTRAINT media_profile_id_fkey
            FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- media_poster_media_id_fkey
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'media_poster_media_id_fkey' AND conrelid = 'public.media'::regclass
    ) THEN
        ALTER TABLE public.media ADD CONSTRAINT media_poster_media_id_fkey
            FOREIGN KEY (poster_media_id) REFERENCES public.media(id) ON DELETE SET NULL;
    END IF;
END
$$;

-- =========================================================================
-- 5. INDEXES ON public.media
-- =========================================================================

-- Partial unique index: one primary image per profile among active rows
DROP INDEX IF EXISTS public.media_one_primary_image_per_profile;
CREATE UNIQUE INDEX media_one_primary_image_per_profile
    ON public.media (profile_id)
    WHERE type = 'image'
      AND is_primary = true
      AND deleted_at IS NULL;

-- Partial index: active media per profile
DROP INDEX IF EXISTS public.media_profile_id_idx;
CREATE INDEX media_profile_id_idx
    ON public.media (profile_id)
    WHERE deleted_at IS NULL;

-- =========================================================================
-- 6. ENABLE RLS ON public.media
-- =========================================================================

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 7. RLS POLICIES ON public.media (drop + recreate for determinism)
-- =========================================================================

-- Remove any stale policies that could conflict
DROP POLICY IF EXISTS "Public active media are viewable by everyone" ON public.media;
DROP POLICY IF EXISTS "media_insert_own" ON public.media;
DROP POLICY IF EXISTS "media_update_own" ON public.media;
DROP POLICY IF EXISTS "media_delete_own" ON public.media;
DROP POLICY IF EXISTS "Authenticated users can delete their own media" ON public.media;

-- 7a. Public read for active media
CREATE POLICY "Public active media are viewable by everyone"
    ON public.media
    FOR SELECT
    TO public
    USING (deleted_at IS NULL);

-- 7b. Authenticated insert own media
CREATE POLICY "media_insert_own"
    ON public.media
    FOR INSERT
    TO authenticated
    WITH CHECK (
        profile_id IN (
            SELECT id FROM public.profiles WHERE auth_id = auth.uid()
        )
    );

-- 7c. Authenticated update own active media
CREATE POLICY "media_update_own"
    ON public.media
    FOR UPDATE
    TO authenticated
    USING (
        deleted_at IS NULL
        AND profile_id IN (
            SELECT id FROM public.profiles WHERE auth_id = auth.uid()
        )
    )
    WITH CHECK (
        profile_id IN (
            SELECT id FROM public.profiles WHERE auth_id = auth.uid()
        )
    );

-- =========================================================================
-- 8. PRIVILEGES ON public.media
-- =========================================================================

-- Reset to a known state
REVOKE ALL ON public.media FROM anon, authenticated;

-- anon: SELECT only
GRANT SELECT ON public.media TO anon;

-- authenticated: SELECT + INSERT, no table-level UPDATE, no DELETE
GRANT SELECT, INSERT ON public.media TO authenticated;

-- authenticated: column-level UPDATE on is_primary only
GRANT UPDATE (is_primary) ON public.media TO authenticated;

-- service_role: full privileges
GRANT ALL ON public.media TO service_role;

-- =========================================================================
-- 9. CREATE public.media_deletion_jobs TABLE
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.media_deletion_jobs (
    id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id                 uuid        NOT NULL,
    provider                 text        NOT NULL,
    provider_asset_id        text,
    bucket_id                text,
    storage_path             text,
    status                   text        NOT NULL DEFAULT 'pending',
    retry_count              integer     NOT NULL DEFAULT 0,
    next_retry_at            timestamptz,
    locked_at                timestamptz,
    locked_by                text,
    error_message            text,
    last_error_at            timestamptz,
    provider_delete_reference text,
    created_at               timestamptz NOT NULL DEFAULT now(),
    processed_at             timestamptz
);

-- =========================================================================
-- 10. CONSTRAINTS ON public.media_deletion_jobs (safe conditional creation)
-- =========================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'media_deletion_jobs_media_id_fkey'
          AND conrelid = 'public.media_deletion_jobs'::regclass
    ) THEN
        ALTER TABLE public.media_deletion_jobs ADD CONSTRAINT media_deletion_jobs_media_id_fkey
            FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'media_deletion_jobs_retry_count_check'
          AND conrelid = 'public.media_deletion_jobs'::regclass
    ) THEN
        ALTER TABLE public.media_deletion_jobs ADD CONSTRAINT media_deletion_jobs_retry_count_check
            CHECK (retry_count >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'media_deletion_jobs_status_check'
          AND conrelid = 'public.media_deletion_jobs'::regclass
    ) THEN
        ALTER TABLE public.media_deletion_jobs ADD CONSTRAINT media_deletion_jobs_status_check
            CHECK (status IN (
                'pending',
                'processing',
                'retry',
                'completed',
                'failed'
            ));
    END IF;
END
$$;

-- =========================================================================
-- 11. INDEX ON public.media_deletion_jobs
-- =========================================================================

DROP INDEX IF EXISTS public.media_deletion_jobs_one_active_per_media;
CREATE UNIQUE INDEX media_deletion_jobs_one_active_per_media
    ON public.media_deletion_jobs (media_id)
    WHERE status IN ('pending', 'processing', 'retry');

-- =========================================================================
-- 12. ENABLE RLS ON public.media_deletion_jobs
-- =========================================================================

ALTER TABLE public.media_deletion_jobs ENABLE ROW LEVEL SECURITY;

-- No anon or authenticated policies on this table.

-- =========================================================================
-- 13. PRIVILEGES ON public.media_deletion_jobs
-- =========================================================================

REVOKE ALL ON public.media_deletion_jobs FROM anon, authenticated;
GRANT ALL ON public.media_deletion_jobs TO service_role;

-- =========================================================================
-- 14. FUNCTION: public.soft_delete_media(p_media_id uuid)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.soft_delete_media(p_media_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_media public.media%ROWTYPE;
BEGIN
    SELECT * INTO v_media
    FROM public.media
    WHERE id = p_media_id
      AND deleted_at IS NULL
      AND profile_id IN (
          SELECT id FROM public.profiles WHERE auth_id = auth.uid()
      )
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Media not found or access denied';
    END IF;

    UPDATE public.media
    SET deleted_at = now(),
        updated_at = now()
    WHERE id = p_media_id;

    INSERT INTO public.media_deletion_jobs (
        media_id,
        provider,
        provider_asset_id,
        bucket_id,
        storage_path,
        status
    ) VALUES (
        v_media.id,
        v_media.provider,
        v_media.provider_asset_id,
        v_media.bucket_id,
        v_media.storage_path,
        'pending'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_media(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_media(uuid) TO authenticated, service_role;

-- =========================================================================
-- 15. FUNCTION: public.claim_media_deletion_jobs(p_limit, p_worker_id)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.claim_media_deletion_jobs(
    p_limit     integer DEFAULT 10,
    p_worker_id text    DEFAULT 'edge-function-worker'
)
RETURNS SETOF public.media_deletion_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH candidates AS (
        SELECT id
        FROM public.media_deletion_jobs
        WHERE
            (
                status IN ('pending', 'retry')
                AND (next_retry_at IS NULL OR next_retry_at <= now())
            )
            OR
            (
                status = 'processing'
                AND locked_at < now() - interval '10 minutes'
            )
        ORDER BY created_at
        FOR UPDATE SKIP LOCKED
        LIMIT p_limit
    )
    UPDATE public.media_deletion_jobs AS j
    SET
        status    = 'processing',
        locked_at = now(),
        locked_by = p_worker_id
    FROM candidates c
    WHERE j.id = c.id
    RETURNING j.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_media_deletion_jobs(integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_media_deletion_jobs(integer, text) TO service_role;

COMMIT;
