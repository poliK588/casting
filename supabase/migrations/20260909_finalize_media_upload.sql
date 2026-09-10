-- =============================================================================
-- Migration: finalize_media_upload RPC
-- Date: 2026-09-09
-- Summary: Narrow SECURITY DEFINER function that allows an authenticated talent
--          to mark ONLY their own media row as 'ready' after a successful
--          Storage upload.  Changes only status and updated_at.
-- =============================================================================

BEGIN;

-- =========================================================================
-- 1. FUNCTION: public.finalize_media_upload(p_media_id uuid)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.finalize_media_upload(p_media_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    v_profile_id uuid;
    v_status     text;
    v_deleted_at timestamptz;
BEGIN
    -- Look up the media row
    SELECT m.profile_id, m.status, m.deleted_at
      INTO v_profile_id, v_status, v_deleted_at
      FROM public.media m
     WHERE m.id = p_media_id;

    -- Row must exist
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Media row not found: %', p_media_id;
    END IF;

    -- Row must belong to the current authenticated user's profile
    IF v_profile_id IS DISTINCT FROM public.current_profile_id() THEN
        RAISE EXCEPTION 'Access denied: media does not belong to your profile';
    END IF;

    -- Row must not be soft-deleted
    IF v_deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Media row has been deleted: %', p_media_id;
    END IF;

    -- Row must currently be in awaiting_upload status
    IF v_status IS DISTINCT FROM 'awaiting_upload' THEN
        RAISE EXCEPTION 'Media status is %, expected awaiting_upload', v_status;
    END IF;

    -- Transition: change ONLY status and updated_at
    UPDATE public.media
       SET status     = 'ready',
           updated_at = now()
     WHERE id = p_media_id;
END;
$$;

-- =========================================================================
-- 2. PRIVILEGES
-- =========================================================================

REVOKE ALL ON FUNCTION public.finalize_media_upload(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_media_upload(uuid) TO authenticated;

COMMIT;
