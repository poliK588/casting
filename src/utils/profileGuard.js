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

// ── Verified Writable Columns (Whitelist) ──
const PROFILE_WRITE_FIELDS = new Set([
  'auth_id', 'name', 'age', 'gender', 'location', 'union_status', 'status',
  'rating', 'credits', 'rate', 'recent_credit', 'image_url', 'first_name',
  'last_name', 'birth_date', 'age_range', 'height_ft', 'height_in',
  'weight_lbs', 'shoe_size', 'shirt_size', 'pant_size', 'waist_size_in',
  'neck_size_in', 'sleeve_size_in', 'inseam_size_in', 'hat_size',
  'hair_color', 'hair_length', 'physical_disability', 'union_number',
  'transportation', 'description', 'city', 'province', 'experience_driving',
  'experience_bartending', 'experience_serving', 'role', 'submitted',
  'agent_name', 'contact_email', 'contact_phone', 'social_links', 'media',
  'verification_status', 'eye_color'
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

    // Build the payload using ONLY whitelisted fields
    const payload = {};
    for (const field of PROFILE_WRITE_FIELDS) {
      if (raw[field] !== undefined) {
        payload[field] = raw[field];
      }
    }

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