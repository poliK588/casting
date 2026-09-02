-- =============================================================================
-- Migration: Create public.talent_vehicles
-- Date: 2026-09-02
-- Summary: Profile-owned vehicle table with owner CRUD + admin read-all RLS.
--          Uses existing helpers: current_profile_id(), is_admin().
-- =============================================================================

BEGIN;

-- =========================================================================
-- 1. CREATE TABLE
-- =========================================================================

CREATE TABLE public.talent_vehicles (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id      uuid        NOT NULL
                                REFERENCES public.profiles(id)
                                ON DELETE CASCADE,
    make            text        NOT NULL,
    model           text        NOT NULL,
    year            smallint    NULL
                                CHECK (year >= 1900 AND year <= 2100),
    color           text        NULL,
    photo_media_id  uuid        NULL
                                REFERENCES public.media(id)
                                ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- =========================================================================
-- 2. INDEX
-- =========================================================================

CREATE INDEX talent_vehicles_profile_id_idx
    ON public.talent_vehicles (profile_id);

-- =========================================================================
-- 3. ENABLE RLS
-- =========================================================================

ALTER TABLE public.talent_vehicles ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 4. PRIVILEGES
-- =========================================================================

REVOKE ALL ON public.talent_vehicles FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.talent_vehicles TO authenticated;
GRANT ALL ON public.talent_vehicles TO service_role;

-- =========================================================================
-- 5. RLS POLICIES
-- =========================================================================

-- 5a. Owner can read own vehicles
CREATE POLICY "talent_vehicles_select_own"
    ON public.talent_vehicles
    FOR SELECT
    TO authenticated
    USING (profile_id = public.current_profile_id());

-- 5b. Admin can read all vehicles
CREATE POLICY "talent_vehicles_select_admin"
    ON public.talent_vehicles
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- 5c. Owner can insert own vehicles
CREATE POLICY "talent_vehicles_insert_own"
    ON public.talent_vehicles
    FOR INSERT
    TO authenticated
    WITH CHECK (profile_id = public.current_profile_id());

-- 5d. Owner can update own vehicles
CREATE POLICY "talent_vehicles_update_own"
    ON public.talent_vehicles
    FOR UPDATE
    TO authenticated
    USING (profile_id = public.current_profile_id())
    WITH CHECK (profile_id = public.current_profile_id());

-- 5e. Owner can delete own vehicles
CREATE POLICY "talent_vehicles_delete_own"
    ON public.talent_vehicles
    FOR DELETE
    TO authenticated
    USING (profile_id = public.current_profile_id());

COMMIT;
