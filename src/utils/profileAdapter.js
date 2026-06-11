export const computeAge = (dob) => {
  if (!dob) return 0;
  const d = new Date(dob);
  if (isNaN(d)) return 0;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age > 0 ? age : 0;
};

const safeNum = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

export const normalizeProfile = (raw) => {
  if (!raw || typeof raw !== 'object') {
    return {
      id: null,
      auth_id: null,
      name: 'Unknown Artist',
      age: 0,
      age_range: '—',
      location: '',
      heroImg: '',
      avatar: '',
      rating: 0,
      credits: 0,
      submitted: 0,
      rate: 0,
      skills: [],
      languages: [],
      ethnicity: null,
      is_verified: false,
      verification_status: 'unverified',
      status: 'available',
      busy_days: 0,
      partial_days: 0,
    };
  }

  const name = [raw?.first_name, raw?.last_name].filter(Boolean).join(' ') || 'Unknown Artist';

  // RPC age is source of truth; computeAge is fallback only
  const age = raw.age != null ? safeNum(raw.age) : computeAge(raw.birth_date);
  
  const location = [raw?.city, raw?.province].filter(Boolean).join(', ') || raw?.location || '';

  const skills = Array.isArray(raw?.user_skills) 
    ? raw.user_skills.map(s => s?.skills?.name).filter(Boolean) 
    : [];

  const languages = Array.isArray(raw?.user_languages)
    ? raw.user_languages.map(l => l?.languages?.name).filter(Boolean)
    : [];

  const ethnicity = raw?.user_ethnicities?.[0]?.ethnicities?.name ?? null;

  return {
    id: raw.id || null,
    auth_id: raw.auth_id || null,
    name,
    age,
    age_range: raw.age_range || '—',
    location,
    heroImg: raw.image_url || '',
    avatar: raw.image_url || '',
    rating: raw.rating || 0,
    credits: raw.credits || 0,
    submitted: raw.submitted || 0,
    rate: raw.rate || 0,
    skills,
    languages,
    ethnicity,
    is_verified: raw.verification_status === 'verified',
    verification_status: raw.verification_status || 'unverified',
    // Casting-critical physical data for HUD card
    height_ft: raw.height_ft ?? null,
    height_in: raw.height_in ?? null,
    weight_lbs: raw.weight_lbs ?? null,
    union_status: raw.union_status || null,
    social_links: raw.social_links || {},
    user_languages: raw.user_languages || [],
    status: raw.status || 'available',
    // Enterprise availability analytics from RPC
    busy_days: safeNum(raw.busy_days),
    partial_days: safeNum(raw.partial_days),
    _raw: raw,
  };
};
