-- =============================================================================
-- Migration: Vehicle Media Context Foundation
-- Date: 2026-09-09
--
-- Adds an explicit media_context column to public.media so Vehicle Photos
-- remain type = 'image' but are separated from normal portfolio media.
--
-- Changes:
--   1. Add media_context column with DEFAULT 'profile'
--   2. Add CHECK constraint: media_context IN ('profile', 'vehicle')
--   3. Extend authenticated column-level INSERT to include media_context
--   4. Create trigger function to validate talent_vehicles.photo_media_id
--   5. Attach trigger to talent_vehicles
--
-- Does NOT modify: media.type CHECK, soft-delete worker, frontend, Storage.
-- =============================================================================

BEGIN;

-- =========================================================================
-- 1. ADD COLUMN: public.media.media_context
--
--    DEFAULT 'profile' ensures all existing rows are automatically valid.
--    NOT NULL prevents future inserts from omitting the value.
-- =========================================================================

ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS media_context text NOT NULL DEFAULT 'profile';

-- =========================================================================
-- 2. CHECK CONSTRAINT: media_context_check
--
--    Only 'profile' (normal portfolio) and 'vehicle' (vehicle photo)
--    are permitted. Drop-if-exists makes this idempotent.
-- =========================================================================

ALTER TABLE public.media DROP CONSTRAINT IF EXISTS media_context_check;
ALTER TABLE public.media ADD CONSTRAINT media_context_check
    CHECK (media_context IN ('profile', 'vehicle'));

-- =========================================================================
-- 3. EXTEND AUTHENTICATED INSERT PRIVILEGES
--
--    The 20260819 migration restricted INSERT to 14 explicit columns.
--    We must add media_context to that list. PostgreSQL column-level GRANT
--    is additive — granting on a new column does NOT revoke existing grants.
--    We do NOT re-grant the original 14 columns; they remain intact.
-- =========================================================================

GRANT INSERT (media_context) ON public.media TO authenticated;

-- =========================================================================
-- 4. TRIGGER FUNCTION: validate_vehicle_photo_media
--
--    When photo_media_id is set on talent_vehicles, verify the referenced
--    media row:
--      - exists
--      - belongs to the same profile  (media.profile_id = NEW.profile_id)
--      - is an image                  (media.type = 'image')
--      - is a vehicle context image   (media.media_context = 'vehicle')
--      - has not been soft-deleted     (media.deleted_at IS NULL)
--
--    NULL photo_media_id is always allowed (no photo attached).
--
--    search_path is hardened to pg_catalog, pg_temp. All table references
--    are fully qualified.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.validate_vehicle_photo_media()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    v_profile_id  uuid;
    v_type        text;
    v_context     text;
    v_deleted_at  timestamptz;
BEGIN
    -- NULL photo_media_id is always valid (no photo attached)
    IF NEW.photo_media_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Look up the referenced media row
    SELECT m.profile_id, m.type, m.media_context, m.deleted_at
      INTO v_profile_id, v_type, v_context, v_deleted_at
      FROM public.media m
     WHERE m.id = NEW.photo_media_id;

    -- Media row must exist
    IF NOT FOUND THEN
        RAISE EXCEPTION 'photo_media_id references a media row that does not exist (id=%)', NEW.photo_media_id;
    END IF;

    -- Media must belong to the same profile
    IF v_profile_id IS DISTINCT FROM NEW.profile_id THEN
        RAISE EXCEPTION 'photo_media_id references a media row owned by a different profile';
    END IF;

    -- Media must be an image
    IF v_type != 'image' THEN
        RAISE EXCEPTION 'photo_media_id must reference a media row with type = ''image'', got ''%''', v_type;
    END IF;

    -- Media must be in vehicle context
    IF v_context != 'vehicle' THEN
        RAISE EXCEPTION 'photo_media_id must reference a media row with media_context = ''vehicle'', got ''%''', v_context;
    END IF;

    -- Media must not be soft-deleted
    IF v_deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'photo_media_id references a soft-deleted media row (deleted_at=%)', v_deleted_at;
    END IF;

    RETURN NEW;
END;
$$;

-- =========================================================================
-- 5. TRIGGER: trg_validate_vehicle_photo_media
--
--    Fires BEFORE INSERT or UPDATE OF photo_media_id, profile_id.
--    This covers:
--      - New vehicle with a photo already set
--      - Changing the photo on an existing vehicle
--      - Changing the profile_id (prevents cross-user photo attachment)
-- =========================================================================

DROP TRIGGER IF EXISTS trg_validate_vehicle_photo_media ON public.talent_vehicles;

CREATE TRIGGER trg_validate_vehicle_photo_media
    BEFORE INSERT OR UPDATE OF photo_media_id, profile_id
    ON public.talent_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_vehicle_photo_media();

COMMIT;
