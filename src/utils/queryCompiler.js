const CACHE_VERSION = 'v2.0';
const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';
let lastLogTime = 0;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const AVAILABILITY_MAP = {
  'available now': 'available',
  'on hold': 'partial',
  'booked': 'busy',
};

export const HEIGHT_DEFAULT_RANGE = [48, 84];

const toInt = (val, fallback = null) => {
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? fallback : parsed;
};

const safeRange = (arr, fallback) => {
  if (!Array.isArray(arr) || arr.length !== 2) return [...fallback];
  const a = toInt(arr[0], fallback[0]);
  const b = toInt(arr[1], fallback[1]);
  return [a, b];
};

const normalizeRange = (arr, fallback) => {
  const [a, b] = safeRange(arr, fallback);
  return a <= b ? [a, b] : [b, a];
};

const validateFacet = (type, arr) => {
  const cleaned = Array.isArray(arr) ? arr.filter(Boolean) : [];
  if (type === 'uuid') {
    return cleaned.filter(v => typeof v === 'string' && UUID_REGEX.test(v));
  }
  return cleaned.filter(v => typeof v === 'string');
};

const safeDate = (val) => {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  return DATE_REGEX.test(trimmed) ? trimmed : null;
};

export const FACET_SCHEMA = {
  gender: { type: 'string', rpc: 'p_gender', url: 'gender' },
  hair_color: { type: 'string', rpc: 'p_hair_color', url: 'hair_c' },
  hair_length: { type: 'string', rpc: 'p_hair_length', url: 'hair_l' },
  eye_color: { type: 'string', rpc: 'p_eye_color', url: 'eye' },
  union_status: { type: 'string', rpc: 'p_union_status', url: 'union' },
  province: { type: 'string', rpc: 'p_province', url: 'prov' },
  shirt_size: { type: 'string', rpc: 'p_shirt_size', url: 'shirt' },
  pant_size: { type: 'string', rpc: 'p_pant_size', url: 'pant' },
  hat_size: { type: 'string', rpc: 'p_hat_size', url: 'hat' },
  shoe_size: { type: 'string', rpc: 'p_shoe_size', url: 'shoe' },
  transportation: { type: 'string', rpc: 'p_transportation', url: 'trans' },
  verification_status: { type: 'string', rpc: 'p_verification_status', url: 'verif' },
  availability: { type: 'string', rpc: 'p_availability', url: 'avail' },
  skills: { type: 'uuid', rpc: 'p_skills', url: 'skills' },
  languages: { type: 'uuid', rpc: 'p_languages', url: 'langs' },
  ethnicities: { type: 'uuid', rpc: 'p_ethnicities', url: 'eth' },
};

export const DEFAULT_STATE = {
  search: '',
  range: {
    age: [18, 65],
    height: [...HEIGHT_DEFAULT_RANGE],
    weight: [100, 300],
  },
  dates: { exact: null, from: null, to: null, window_days: 7 },
  facets: Object.keys(FACET_SCHEMA).reduce((acc, key) => ({ ...acc, [key]: [] }), {}),
  pagination: { limit: 50, offset: 0 },
};

export const normalizeState = (state) => {
  const s = state || {};
  const normalized = {
    search: typeof s.search === 'string' ? s.search : DEFAULT_STATE.search,
    range: {
      age: normalizeRange(s.range?.age, DEFAULT_STATE.range.age),
      height: normalizeRange(s.range?.height, DEFAULT_STATE.range.height),
      weight: normalizeRange(s.range?.weight, DEFAULT_STATE.range.weight),
    },
    dates: {
      exact: safeDate(s.dates?.exact),
      from: safeDate(s.dates?.from),
      to: safeDate(s.dates?.to),
      window_days: Number.isInteger(s.dates?.window_days)
        ? Math.min(Math.max(s.dates.window_days, 1), 30)
        : DEFAULT_STATE.dates.window_days,
    },
    facets: {},
    pagination: {
      limit: toInt(s.pagination?.limit, DEFAULT_STATE.pagination.limit),
      offset: toInt(s.pagination?.offset, DEFAULT_STATE.pagination.offset),
    },
  };

  Object.entries(FACET_SCHEMA).forEach(([key, config]) => {
    normalized.facets[key] = validateFacet(config.type, s.facets?.[key]);
  });

  return normalized;
};

const runSchemaDiagnostics = (state, compiledParams) => {
  if (!isDev) return;
  
  const now = Date.now();
  if (now - lastLogTime < 500) return;
  lastLogTime = now;

  console.groupCollapsed('Search Schema Engine: Diagnostics');

  const errors = [];
  if (state.search && typeof state.search !== 'string') {
    errors.push('"search" must be a string');
  }
  if (state.range?.age && (!Array.isArray(state.range.age) || state.range.age.length !== 2)) {
    errors.push('"range.age" must be a [min, max] array');
  }
  if (state.range?.height && (!Array.isArray(state.range.height) || state.range.height.length !== 2)) {
    errors.push('"range.height" must be a [min, max] array');
  }

  Object.entries(FACET_SCHEMA).forEach(([key, config]) => {
    const arr = state.facets?.[key];
    if (arr !== undefined && !Array.isArray(arr)) {
      errors.push(`Facet "${key}" must be an array`);
    } else if (config.type === 'uuid' && Array.isArray(arr)) {
      const invalid = arr.find(v => typeof v !== 'string' || !UUID_REGEX.test(v));
      if (invalid) errors.push(`Facet "${key}" contains invalid UUID: ${invalid}`);
    }
  });

  if (errors.length > 0) {
    console.error('Schema Violations:', errors);
  } else {
    console.log('Schema Validation: Passed');
  }

  const activeParams = Object.keys(compiledParams)
    .filter(k => compiledParams[k] !== null)
    .reduce((acc, k) => ({ ...acc, [k]: compiledParams[k] }), {});

  console.log(`Active RPC Params (${Object.keys(activeParams).length}):`, activeParams);
  console.groupEnd();
};

export function compileSearchParams(state, { mode = 'public' } = {}) {
  const safeState = normalizeState(state);
  const { search, range, facets, dates, pagination } = safeState;

  // ── Availability: map UI labels → RPC values (do NOT mutate safeState) ──
  const rawAvailability = facets.availability || [];
  const mappedAvailability = rawAvailability
    .map(v => {
      if (!v) return null;
      const key = v.toLowerCase().trim();
      return AVAILABILITY_MAP[key] || null;
    })
    .filter(Boolean);

  // ── Date routing: strict mutual exclusion per v2.3.1 contract ──
  let p_date = null;
  let p_date_from = null;
  let p_date_to = null;
  let p_window_days = null;

  if (dates.exact) {
    p_date = dates.exact;
  } else if (dates.from && dates.to) {
    p_date_from = dates.from;
    p_date_to = dates.to;
  } else {
    p_window_days = dates.window_days;
  }

  const params = {
    p_mode: mode,
    p_search: search.trim().length >= 2 ? search.trim() : null,
    p_age_min: range.age[0] !== DEFAULT_STATE.range.age[0] ? range.age[0] : null,
    p_age_max: range.age[1] !== DEFAULT_STATE.range.age[1] ? range.age[1] : null,
    p_height_min_total: range.height[0] !== HEIGHT_DEFAULT_RANGE[0] ? range.height[0] : null,
    p_height_max_total: range.height[1] !== HEIGHT_DEFAULT_RANGE[1] ? range.height[1] : null,
    p_weight_min: range.weight[0] !== DEFAULT_STATE.range.weight[0] ? range.weight[0] : null,
    p_weight_max: range.weight[1] !== DEFAULT_STATE.range.weight[1] ? range.weight[1] : null,
    p_date,
    p_date_from,
    p_date_to,
    p_window_days,
    p_limit: Math.min(pagination.limit + 1, 200),
    p_offset: pagination.offset,
    p_availability: mappedAvailability.length > 0 ? mappedAvailability : null,
  };

  // ── Facets: pass validated arrays directly (UUIDs preserved) ──
  Object.entries(FACET_SCHEMA).forEach(([facetKey, config]) => {
    // availability is already handled above with mapping
    if (facetKey === 'availability') return;
    const arr = facets[facetKey];
    params[config.rpc] = arr.length > 0 ? arr : null;
  });

  runSchemaDiagnostics(state, params);

  return params;
}

export function stateToUrl(state) {
  const params = new URLSearchParams();
  const safeState = normalizeState(state);
  const { search, range, dates, facets } = safeState;

  if (search.length >= 2) params.set('q', search.trim());

  if (range.age[0] !== 18 || range.age[1] !== 65) params.set('age', `${range.age[0]}-${range.age[1]}`);
  if (range.height[0] !== HEIGHT_DEFAULT_RANGE[0] || range.height[1] !== HEIGHT_DEFAULT_RANGE[1]) {
    params.set('height', `${range.height[0]}-${range.height[1]}`);
  }
  if (range.weight[0] !== 100 || range.weight[1] !== 300) params.set('weight', `${range.weight[0]}-${range.weight[1]}`);

  // Date URL params (raw UI values, no mapping)
  if (dates.exact) {
    params.set('dt', dates.exact);
  } else if (dates.from && dates.to) {
    params.set('dt_from', dates.from);
    params.set('dt_to', dates.to);
  }
  if (dates.window_days !== DEFAULT_STATE.dates.window_days) {
    params.set('dt_win', String(dates.window_days));
  }

  Object.entries(FACET_SCHEMA).forEach(([facetKey, config]) => {
    const arr = facets[facetKey];
    if (arr.length > 0) {
      params.set(config.url, arr.map(encodeURIComponent).join(','));
    }
  });

  const str = params.toString();
  return str ? `?${str}` : '';
}

export function urlToState(searchString) {
  const params = new URLSearchParams(searchString);
  const state = structuredClone(DEFAULT_STATE);

  if (params.get('q')) state.search = params.get('q');

  state.range.age = normalizeRange(params.get('age')?.split('-'), DEFAULT_STATE.range.age);
  state.range.height = normalizeRange(params.get('height')?.split('-'), DEFAULT_STATE.range.height);
  state.range.weight = normalizeRange(params.get('weight')?.split('-'), DEFAULT_STATE.range.weight);

  // Restore date state from URL
  const dtExact = safeDate(params.get('dt'));
  const dtFrom = safeDate(params.get('dt_from'));
  const dtTo = safeDate(params.get('dt_to'));
  const dtWin = toInt(params.get('dt_win'), null);

  if (dtExact) {
    state.dates.exact = dtExact;
  } else if (dtFrom && dtTo) {
    state.dates.from = dtFrom;
    state.dates.to = dtTo;
  }
  if (dtWin !== null) {
    state.dates.window_days = dtWin;
  }

  Object.entries(FACET_SCHEMA).forEach(([facetKey, config]) => {
    const val = params.get(config.url);
    if (val) {
      state.facets[facetKey] = val.split(',').map(decodeURIComponent);
    }
  });

  return normalizeState(state);
}

export function generateRequestKey(state, mode = 'admin') {
  const safeState = normalizeState(state);
  
  const keyObj = {
    v: CACHE_VERSION,
    m: mode,
    q: safeState.search,
    a: safeState.range.age,
    h: safeState.range.height,
    w: safeState.range.weight,
    d: {
      exact: safeState.dates.exact,
      from: safeState.dates.from,
      to: safeState.dates.to,
      window_days: safeState.dates.window_days,
    },
    f: Object.keys(FACET_SCHEMA).sort().reduce((acc, key) => {
      acc[key] = [...safeState.facets[key]].sort();
      return acc;
    }, {}),
    lim: safeState.pagination.limit,
    off: safeState.pagination.offset,
  };

  return JSON.stringify(keyObj);
}
