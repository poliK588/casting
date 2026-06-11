// src/utils/profileGuard.js
// Version 3.1 — Dynamic Transparent Mapper with Strict Type Enforcement

// ── Integer columns in the 'profiles' table ──
const INT_FIELDS = new Set([
  'age', 'height_ft', 'height_in', 'weight_lbs',
  'waist_size_in', 'neck_size_in', 'sleeve_size_in', 'inseam_size_in',
  'credits', 'rate', 'submitted'
]);

// ── Float columns ──
const FLOAT_FIELDS = new Set(['rating']);

// ── Boolean columns in the 'profiles' table ──
const BOOL_FIELDS = new Set([
  'experience_driving', 'experience_bartending', 'experience_serving'
]);

// ── Fields that must NEVER be sent to the 'profiles' table ──
const PRIVATE_FIELDS = new Set([
  'phone', 'street_address', 'unit_number', 'postal_code'
]);

// ── Relational / join-only fields (stored in junction tables, not 'profiles') ──
const RELATION_FIELDS = new Set([
  'ethnicity', 'skills', 'languages',
  'profile_private_info', 'user_skills', 'user_languages', 'user_ethnicities'
]);

// ── Supabase metadata that must never be sent back on upsert ──
const META_FIELDS = new Set([
  'id', 'created_at', 'updated_at', 'fts'
]);

export const profileGuard = {
  /**
   * 1. NORMALIZE PUBLIC (Table: profiles)
   * Passes through ALL form fields while enforcing strict types.
   * Strips private, relational, and meta fields to prevent SQL errors.
   */
  normalize(raw, sessionUserId) {
    if (!raw) return null;

    // Derived Age Calculation
    let computedAge = raw.age;
    if (raw.birth_date) {
      const dob = new Date(raw.birth_date);
      if (!isNaN(dob)) {
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        computedAge = age;
      }
    }

    // Derived full name
    const name = [raw.first_name, raw.last_name].filter(Boolean).join(' ') || raw.name || null;

    // Derived location
    const city = raw.city ? String(raw.city).trim() : null;
    const province = raw.province || 'Ontario';
    const location = city ? `${city}, ${province}` : (raw.location || province);

    // Build the base payload from raw — take EVERYTHING the form provides
    const payload = { ...raw };

    // Inject system-level computed fields
    payload.auth_id = sessionUserId;
    payload.age = computedAge;
    payload.name = name;
    payload.city = city;
    payload.province = province;
    payload.location = location;

    // Ensure JSONB fields have correct types
    payload.social_links = (raw.social_links && typeof raw.social_links === 'object') ? raw.social_links : {};
    payload.media = Array.isArray(raw.media) ? raw.media : [];

    // ── Type Enforcement: parseInt for integer columns ──
    for (const field of INT_FIELDS) {
      if (field in payload) {
        const n = parseInt(payload[field], 10);
        payload[field] = Number.isNaN(n) ? null : n;
      }
    }

    // ── Type Enforcement: parseFloat for float columns ──
    for (const field of FLOAT_FIELDS) {
      if (field in payload) {
        const n = parseFloat(payload[field]);
        payload[field] = Number.isNaN(n) ? null : n;
      }
    }

    // ── Type Enforcement: boolean for toggle columns ──
    for (const field of BOOL_FIELDS) {
      if (field in payload) {
        const v = payload[field];
        payload[field] = v === true || v === 'true' || v === 1 || v === '1';
      }
    }

    // ── Strip fields that do NOT belong in the 'profiles' table ──
    for (const field of PRIVATE_FIELDS) delete payload[field];
    for (const field of RELATION_FIELDS) delete payload[field];
    for (const field of META_FIELDS) delete payload[field];

    // Remove any undefined values (Supabase rejects explicit undefined)
    return Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined)
    );
  },

  /**
   * 2. NORMALIZE PRIVATE (Table: profile_private_info)
   */
  normalizePrivate(raw, sessionUserId) {
    if (!raw) return null;
    return {
      auth_id: sessionUserId,
      phone: raw.phone?.toString().trim() || null,
      street_address: raw.street_address?.trim() || null,
      unit_number: raw.unit_number?.trim() || null,
      postal_code: raw.postal_code?.trim() || null
    };
  },

  /**
   * 3. JUNCTION HELPER — extract relation IDs from form state
   */
  getRelationIds(raw, key) {
    const val = raw[key];
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  },

  /**
   * 4. VALIDATION
   */
  validate(profile) {
    if (!profile?.auth_id) return { valid: false, error: 'MISSING_AUTH_ID' };
    if (!profile.first_name || !profile.last_name) return { valid: false, error: 'NAME_REQUIRED' };
    return { valid: true };
  }
};