-- =============================================================================
-- ROLLBACK: Remove p_city parameter from search_talents RPC
-- Use this ONLY if you need to revert the p_city patch.
-- WARNING: After running this, the frontend will error until you also remove
--          'city' from FACET_SCHEMA in src/utils/queryCompiler.js
-- =============================================================================

CREATE OR REPLACE FUNCTION public.search_talents(
  p_mode          text    DEFAULT 'public',
  p_search        text    DEFAULT NULL,
  p_age_min       int     DEFAULT NULL,
  p_age_max       int     DEFAULT NULL,
  p_height_min_total int  DEFAULT NULL,
  p_height_max_total int  DEFAULT NULL,
  p_weight_min    int     DEFAULT NULL,
  p_weight_max    int     DEFAULT NULL,
  p_date          date    DEFAULT NULL,
  p_date_from     date    DEFAULT NULL,
  p_date_to       date    DEFAULT NULL,
  p_window_days   int     DEFAULT NULL,
  p_limit         int     DEFAULT 51,
  p_offset        int     DEFAULT 0,
  p_availability  text[]  DEFAULT NULL::text[],
  p_gender        text[]  DEFAULT NULL::text[],
  p_hair_color    text[]  DEFAULT NULL::text[],
  p_hair_length   text[]  DEFAULT NULL::text[],
  p_eye_color     text[]  DEFAULT NULL::text[],
  p_union_status  text[]  DEFAULT NULL::text[],
  p_province      text[]  DEFAULT NULL::text[],
  p_shirt_size    text[]  DEFAULT NULL::text[],
  p_pant_size     text[]  DEFAULT NULL::text[],
  p_hat_size      text[]  DEFAULT NULL::text[],
  p_shoe_size     text[]  DEFAULT NULL::text[],
  p_transportation text[] DEFAULT NULL::text[],
  p_verification_status text[] DEFAULT NULL::text[],
  p_skills        uuid[]  DEFAULT NULL::uuid[],
  p_languages     uuid[]  DEFAULT NULL::uuid[],
  p_ethnicities   uuid[]  DEFAULT NULL::uuid[]
)
RETURNS TABLE (
  id              uuid,
  auth_id         uuid,
  first_name      text,
  last_name       text,
  name            text,
  image_url       text,
  age             int,
  age_range       text,
  birth_date      date,
  gender          text,
  height_ft       numeric,
  height_in       int,
  weight_lbs      int,
  hair_color      text,
  hair_length     text,
  eye_color       text,
  union_status    text,
  union_number    text,
  city            text,
  province        text,
  location        text,
  transportation  text,
  shirt_size      text,
  pant_size       text,
  hat_size        text,
  shoe_size       text,
  description     text,
  recent_credit   text,
  rating          numeric,
  credits         int,
  rate            int,
  status          text,
  verification_status text,
  social_links    jsonb,
  created_at      timestamptz,
  updated_at      timestamptz,
  busy_days       bigint,
  partial_days    bigint
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_window_start date;
  v_window_end   date;
BEGIN
  IF p_date IS NOT NULL THEN
    v_window_start := p_date;
    v_window_end   := p_date;
  ELSIF p_date_from IS NOT NULL AND p_date_to IS NOT NULL THEN
    v_window_start := p_date_from;
    v_window_end   := p_date_to;
  ELSE
    v_window_start := CURRENT_DATE;
    v_window_end   := CURRENT_DATE + COALESCE(p_window_days, 7);
  END IF;

  RETURN QUERY
  SELECT
    p.id, p.auth_id, p.first_name, p.last_name, p.name, p.image_url,
    CASE WHEN p.birth_date IS NOT NULL
      THEN EXTRACT(YEAR FROM age(CURRENT_DATE, p.birth_date))::int
      ELSE NULL END AS age,
    p.age_range, p.birth_date, p.gender, p.height_ft, p.height_in,
    p.weight_lbs, p.hair_color, p.hair_length, p.eye_color,
    p.union_status, p.union_number, p.city, p.province, p.location,
    p.transportation, p.shirt_size, p.pant_size, p.hat_size, p.shoe_size,
    p.description, p.recent_credit, p.rating, p.credits, p.rate,
    p.status, p.verification_status, p.social_links,
    p.created_at, p.updated_at,
    COALESCE(avail.busy_days, 0)    AS busy_days,
    COALESCE(avail.partial_days, 0) AS partial_days
  FROM profiles p
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) FILTER (WHERE ta.status = 'busy')   AS busy_days,
      COUNT(*) FILTER (WHERE ta.status = 'partial') AS partial_days
    FROM talent_availability ta
    WHERE ta.talent_id = p.id
      AND ta.date BETWEEN v_window_start AND v_window_end
  ) avail ON true
  WHERE p.role = 'talent'
    AND (p_search IS NULL OR (
      p.first_name ILIKE '%' || p_search || '%'
      OR p.last_name ILIKE '%' || p_search || '%'
      OR p.name ILIKE '%' || p_search || '%'
      OR p.description ILIKE '%' || p_search || '%'))
    AND (p_age_min IS NULL OR EXTRACT(YEAR FROM age(CURRENT_DATE, p.birth_date))::int >= p_age_min)
    AND (p_age_max IS NULL OR EXTRACT(YEAR FROM age(CURRENT_DATE, p.birth_date))::int <= p_age_max)
    AND (p_height_min_total IS NULL OR (COALESCE(p.height_ft, 0) * 12 + COALESCE(p.height_in, 0)) >= p_height_min_total)
    AND (p_height_max_total IS NULL OR (COALESCE(p.height_ft, 0) * 12 + COALESCE(p.height_in, 0)) <= p_height_max_total)
    AND (p_weight_min IS NULL OR p.weight_lbs >= p_weight_min)
    AND (p_weight_max IS NULL OR p.weight_lbs <= p_weight_max)
    AND (p_gender IS NULL OR cardinality(p_gender) = 0 OR p.gender = ANY(p_gender))
    AND (p_hair_color IS NULL OR cardinality(p_hair_color) = 0 OR p.hair_color = ANY(p_hair_color))
    AND (p_hair_length IS NULL OR cardinality(p_hair_length) = 0 OR p.hair_length = ANY(p_hair_length))
    AND (p_eye_color IS NULL OR cardinality(p_eye_color) = 0 OR p.eye_color = ANY(p_eye_color))
    AND (p_union_status IS NULL OR cardinality(p_union_status) = 0 OR p.union_status = ANY(p_union_status))
    AND (p_province IS NULL OR cardinality(p_province) = 0 OR p.province = ANY(p_province))
    AND (p_shirt_size IS NULL OR cardinality(p_shirt_size) = 0 OR p.shirt_size = ANY(p_shirt_size))
    AND (p_pant_size IS NULL OR cardinality(p_pant_size) = 0 OR p.pant_size = ANY(p_pant_size))
    AND (p_hat_size IS NULL OR cardinality(p_hat_size) = 0 OR p.hat_size = ANY(p_hat_size))
    AND (p_shoe_size IS NULL OR cardinality(p_shoe_size) = 0 OR p.shoe_size = ANY(p_shoe_size))
    AND (p_transportation IS NULL OR cardinality(p_transportation) = 0 OR p.transportation = ANY(p_transportation))
    AND (p_verification_status IS NULL OR cardinality(p_verification_status) = 0 OR p.verification_status = ANY(p_verification_status))
    AND (p_availability IS NULL OR cardinality(p_availability) = 0 OR p.status = ANY(p_availability))
    AND ((p_date IS NULL AND p_date_from IS NULL)
      OR NOT EXISTS (
        SELECT 1 FROM talent_availability ta2
        WHERE ta2.talent_id = p.id
          AND ta2.date BETWEEN v_window_start AND v_window_end
          AND ta2.status = 'busy'))
    AND (p_skills IS NULL OR cardinality(p_skills) = 0 OR (
      SELECT COUNT(DISTINCT us.skill_id) FROM user_skills us
      WHERE us.user_id = p.id AND us.skill_id = ANY(p_skills)) = cardinality(p_skills))
    AND (p_languages IS NULL OR cardinality(p_languages) = 0 OR (
      SELECT COUNT(DISTINCT ul.language_id) FROM user_languages ul
      WHERE ul.user_id = p.id AND ul.language_id = ANY(p_languages)) = cardinality(p_languages))
    AND (p_ethnicities IS NULL OR cardinality(p_ethnicities) = 0 OR EXISTS (
      SELECT 1 FROM user_ethnicities ue
      WHERE ue.user_id = p.id AND ue.ethnicity_id = ANY(p_ethnicities)))
  ORDER BY p.updated_at DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
END;
$$;
