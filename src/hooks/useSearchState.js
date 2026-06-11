import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { executeTalentSearch } from '../services/talentService';
import { stateToUrl, urlToState, generateRequestKey, DEFAULT_STATE, HEIGHT_DEFAULT_RANGE } from '../utils/queryCompiler';

const __DEV__ = import.meta.env.DEV;
const log = {
  info: (...args) => __DEV__ && console.log('[Search]', ...args),
  warn: (...args) => __DEV__ && console.warn('[Search]', ...args),
  error: (...args) => console.error('[Search]', ...args),
};

const CACHE_MAX = 80;
const CACHE_TTL = 45_000;

class LRUCache {
  constructor(max = CACHE_MAX) {
    this._max = max;
    this._map = new Map();
  }
  get(key) {
    const entry = this._map.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL) {
      this._map.delete(key);
      log.info('CACHE EXPIRED', key.slice(0, 40));
      return null;
    }
    this._map.delete(key);
    this._map.set(key, entry);
    log.info('CACHE HIT', key.slice(0, 40));
    return entry.data;
  }
  set(key, data) {
    if (this._map.has(key)) this._map.delete(key);
    this._map.set(key, { data, ts: Date.now() });
    if (this._map.size > this._max) {
      const oldest = this._map.keys().next().value;
      this._map.delete(oldest);
      log.info('CACHE EVICT (LRU)', this._map.size);
    }
  }
  clear() { this._map.clear(); }
}

export default function useSearchState() {
  const [refDataState, setRefDataState] = useState({
    skills: 'loading', languages: 'loading', ethnicities: 'loading', userSkills: 'loading'
  });
  const [refDataErrors, setRefDataErrors] = useState({
    skills: null, languages: null, ethnicities: null, userSkills: null
  });
  
  const [dictionaries, setDictionaries] = useState({
    skills: [], languages: [], ethnicities: []
  });
  const [userSkillMap, setUserSkillMap] = useState({});
  const refLoaded = useRef(false);

  const loadDictionary = useCallback(async (table) => {
    try {
      log.info(`INIT ${table}...`);
      const { data, error } = await supabase.from(table).select('id, name').order('name');
      if (error) throw error;
      setDictionaries(prev => ({ ...prev, [table]: data || [] }));
      setRefDataState(p => ({ ...p, [table]: 'ready' }));
      log.info(`INIT ${table} DONE`);
    } catch (err) {
      log.error(`INIT ${table} FAILED`, err.message);
      setRefDataState(p => ({ ...p, [table]: 'error' }));
      setRefDataErrors(p => ({ ...p, [table]: err.message }));
    }
  }, []);

  const loadUserSkills = useCallback(async () => {
    try {
      log.info('INIT user_skills...');
      const { data, error } = await supabase.from('user_skills').select('user_id, skill_id');
      if (error) throw error;
      const map = {};
      (data || []).forEach(row => {
        if (!map[row.user_id]) map[row.user_id] = [];
        map[row.user_id].push(row.skill_id);
      });
      setUserSkillMap(map);
      setRefDataState(p => ({ ...p, userSkills: 'ready' }));
      log.info('INIT user_skills DONE');
    } catch (err) {
      log.error('INIT user_skills FAILED', err.message);
      setRefDataState(p => ({ ...p, userSkills: 'error' }));
      setRefDataErrors(p => ({ ...p, userSkills: err.message }));
    }
  }, []);

  const retryResource = useCallback((resource) => {
    log.info('RETRY', resource);
    setRefDataState(p => ({ ...p, [resource]: 'loading' }));
    setRefDataErrors(p => ({ ...p, [resource]: null }));
    if (resource === 'userSkills') loadUserSkills();
    else loadDictionary(resource);
  }, [loadDictionary, loadUserSkills]);

  useEffect(() => {
    if (refLoaded.current) return;
    refLoaded.current = true;
    Promise.allSettled([
      loadDictionary('skills'),
      loadDictionary('languages'),
      loadDictionary('ethnicities'),
      loadUserSkills()
    ]);
  }, [loadDictionary, loadUserSkills]);

  const isSearchEngineReady = useMemo(() => {
    return Object.values(refDataState).every(s => s === 'ready');
  }, [refDataState]);

  const skillNameMap = useMemo(() => {
    const map = {};
    dictionaries.skills.forEach(s => { map[s.id] = s.name; });
    return map;
  }, [dictionaries.skills]);

  const [state, setState] = useState(() => urlToState(window.location.search));
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isAppending, setIsAppending] = useState(false);

  const requestIdRef = useRef(0);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const urlDebounceRef = useRef(null);
  const cacheRef = useRef(new LRUCache(CACHE_MAX));
  const inFlightKeyRef = useRef(null);

  const userSkillMapRef = useRef(userSkillMap);
  const skillNameMapRef = useRef(skillNameMap);
  useEffect(() => { userSkillMapRef.current = userSkillMap; }, [userSkillMap]);
  useEffect(() => { skillNameMapRef.current = skillNameMap; }, [skillNameMap]);

  const isReadyRef = useRef(false);
  isReadyRef.current = isSearchEngineReady;

  const executeSearch = useCallback(async (searchState, append = false) => {
    if (!isReadyRef.current) {
      log.warn('BLOCKED: Engine not ready');
      return;
    }

    const key = generateRequestKey(searchState);

    if (inFlightKeyRef.current === key && !append) {
      log.info('DEDUP: identical request already in-flight');
      return;
    }

    if (!append) {
      const cached = cacheRef.current.get(key);
      if (cached) {
        setResults(cached.rows);
        setHasMore(cached.hasMore);
        setLoading(false);
        setError(null);
        return;
      }
    }

    const requestFiltersKey = generateRequestKey({
      ...searchState,
      pagination: { limit: searchState.pagination.limit, offset: 0 },
    });

    const thisRequestId = ++requestIdRef.current;
    inFlightKeyRef.current = key;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!append) setLoading(true);
    else setIsAppending(true);
    setError(null);

    log.info('SEARCH START', { id: thisRequestId, append });

    try {
      const data = await executeTalentSearch(searchState, controller.signal);

      if (thisRequestId !== requestIdRef.current) {
        log.warn('STALE response discarded');
        return;
      }

      const rows = data || [];
      const limit = searchState.pagination.limit;
      const moreAvailable = rows.length > limit;
      const displayRows = moreAvailable ? rows.slice(0, limit) : rows;

      if (append) {
        const currentFiltersKey = generateRequestKey({
          ...searchState,
          pagination: { limit: searchState.pagination.limit, offset: 0 },
        });
        if (currentFiltersKey !== requestFiltersKey) {
          log.warn('PAGINATION INTEGRITY VIOLATION');
          return;
        }
      }

      cacheRef.current.set(key, { rows: displayRows, hasMore: moreAvailable });

      setHasMore(moreAvailable);
      if (append) {
        setResults(prev => [...prev, ...displayRows]);
      } else {
        setResults(displayRows);
      }

      log.info('SEARCH DONE', { id: thisRequestId, rows: displayRows.length });
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (thisRequestId !== requestIdRef.current) return;
      log.error('SEARCH ERROR', err.message);
      setError(err.message || 'Search failed');
    } finally {
      if (thisRequestId === requestIdRef.current) {
        setLoading(false);
        setIsAppending(false);
        if (inFlightKeyRef.current === key) inFlightKeyRef.current = null;
      }
    }
  }, []);

  const syncUrl = useCallback((newState) => {
    if (urlDebounceRef.current) clearTimeout(urlDebounceRef.current);
    urlDebounceRef.current = setTimeout(() => {
      const url = stateToUrl(newState);
      const currentUrl = window.location.search || '';
      if (url !== currentUrl) {
        window.history.replaceState(null, '', window.location.pathname + url);
      }
    }, 300);
  }, []);

  const triggerSearch = useCallback((newState, immediate = false) => {
    syncUrl(newState);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (immediate) {
      executeSearch(newState);
    } else {
      debounceRef.current = setTimeout(() => {
        executeSearch(newState);
      }, 500);
    }
  }, [syncUrl, executeSearch]);

  const setSearch = useCallback((value) => {
    setState(prev => {
      const next = { ...prev, search: value, pagination: { ...prev.pagination, offset: 0 } };
      triggerSearch(next, false);
      return next;
    });
  }, [triggerSearch]);

  const setAgeRange = useCallback((range) => {
    setState(prev => {
      const next = { ...prev, range: { ...prev.range, age: range }, pagination: { ...prev.pagination, offset: 0 } };
      triggerSearch(next, false);
      return next;
    });
  }, [triggerSearch]);

  const setWeightRange = useCallback((range) => {
    setState(prev => {
      const next = { ...prev, range: { ...prev.range, weight: range }, pagination: { ...prev.pagination, offset: 0 } };
      triggerSearch(next, false);
      return next;
    });
  }, [triggerSearch]);

  const setHeightRange = useCallback((range) => {
    setState(prev => {
      const next = { ...prev, range: { ...prev.range, height: range }, pagination: { ...prev.pagination, offset: 0 } };
      triggerSearch(next, false);
      return next;
    });
  }, [triggerSearch]);

  const setDates = useCallback((dates) => {
    setState(prev => {
      const next = {
        ...prev,
        dates: { ...DEFAULT_STATE.dates, ...dates },
        pagination: { ...prev.pagination, offset: 0 },
      };
      triggerSearch(next, true);
      return next;
    });
  }, [triggerSearch]);

  const toggleFacet = useCallback((facetKey, value) => {
    setState(prev => {
      const currentValues = prev.facets[facetKey] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      const next = {
        ...prev,
        facets: { ...prev.facets, [facetKey]: newValues },
        pagination: { ...prev.pagination, offset: 0 },
      };
      triggerSearch(next, true);
      return next;
    });
  }, [triggerSearch]);

  const clearFilters = useCallback(() => {
    const next = structuredClone(DEFAULT_STATE);
    setState(next);
    triggerSearch(next, true);
  }, [triggerSearch]);

  const loadMore = useCallback(() => {
    setState(prev => {
      const next = {
        ...prev,
        pagination: { ...prev.pagination, offset: prev.pagination.offset + prev.pagination.limit },
      };
      syncUrl(next);
      executeSearch(next, true);
      return next;
    });
  }, [syncUrl, executeSearch]);

  const activeFilters = useMemo(() => {
    const chips = [];
    const s = state;

    if (s.search && s.search.length >= 2) {
      chips.push({ key: 'search', label: `"${s.search}"`, remove: () => setSearch('') });
    }

    if (s.range.age[0] !== 18 || s.range.age[1] !== 65) {
      chips.push({ key: 'age', label: `Age ${s.range.age[0]}–${s.range.age[1]}`, remove: () => setAgeRange([18, 65]) });
    }

    if (s.range.height[0] !== HEIGHT_DEFAULT_RANGE[0] || s.range.height[1] !== HEIGHT_DEFAULT_RANGE[1]) {
      chips.push({ key: 'height', label: `Height ${s.range.height[0]}″–${s.range.height[1]}″`, remove: () => setHeightRange([...HEIGHT_DEFAULT_RANGE]) });
    }
    
    if (s.range.weight[0] !== 100 || s.range.weight[1] !== 300) {
      chips.push({ key: 'weight', label: `Weight ${s.range.weight[0]}–${s.range.weight[1]}`, remove: () => setWeightRange([100, 300]) });
    }

    if (s.dates?.exact) {
      chips.push({ key: 'date_exact', label: `Date: ${s.dates.exact}`, remove: () => setDates({ exact: null }) });
    } else if (s.dates?.from && s.dates?.to) {
      chips.push({ key: 'date_range', label: `${s.dates.from} → ${s.dates.to}`, remove: () => setDates({ from: null, to: null }) });
    }

    Object.keys(s.facets).forEach(facetKey => {
      if (facetKey === 'skills' || facetKey === 'languages' || facetKey === 'ethnicities') {
        s.facets[facetKey].forEach(id => {
          const dict = dictionaries[facetKey] || [];
          const item = dict.find(x => x.id === id);
          chips.push({ key: `${facetKey}:${id}`, label: item?.name || id.slice(0, 8), remove: () => toggleFacet(facetKey, id) });
        });
      } else {
        s.facets[facetKey].forEach(v => {
          chips.push({ key: `${facetKey}:${v}`, label: v.charAt(0).toUpperCase() + v.slice(1), remove: () => toggleFacet(facetKey, v) });
        });
      }
    });

    return chips;
  }, [state, dictionaries, setSearch, setAgeRange, setHeightRange, setWeightRange, setDates, toggleFacet]);

  const enrichedResults = useMemo(() => {
    if (!isSearchEngineReady) return [];
    const usm = userSkillMapRef.current;
    const snm = skillNameMapRef.current;
    return results.map(profile => ({
      ...profile,
      name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown',
      img: profile.image_url,
      skillNames: (usm[profile.id] || []).map(sid => snm[sid]).filter(Boolean),
    }));
  }, [results, isSearchEngineReady, userSkillMap, skillNameMap]);

  const initialSearchFired = useRef(false);
  useEffect(() => {
    if (!isSearchEngineReady) return;
    if (initialSearchFired.current) return;
    initialSearchFired.current = true;
    log.info('ENGINE READY — initial search');
    executeSearch(state);
  }, [isSearchEngineReady, executeSearch, state]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (urlDebounceRef.current) clearTimeout(urlDebounceRef.current);
      if (abortRef.current) abortRef.current.abort();
      cacheRef.current.clear();
    };
  }, []);

  return {
    state,
    results: enrichedResults,
    loading,
    isAppending,
    isSearchEngineReady,
    refDataState,
    refDataErrors,
    retryResource,
    error,
    hasMore,
    refData: dictionaries,
    skillNameMap,
    setSearch,
    setAgeRange,
    setHeightRange,
    setWeightRange,
    setDates,
    toggleFacet,
    clearFilters,
    loadMore,
    activeFilters,
  };
}
