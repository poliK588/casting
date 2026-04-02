import React, { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import { getTalents } from '../services/talentService';

export const AppContext = createContext();

export const LOC_LABELS = { la:'Los Angeles', nyc:'New York', chi:'Chicago', atl:'Atlanta', aus:'Austin' };
export const UNION_LABELS = { sag:'SAG-AFTRA', afm:'AFM', equity:'AEA (Equity)', nonunion:'Non-Union' };

export function AppProvider({ children }) {
  const [talent, setTalent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [shortlist, setShortlist] = useState(new Set());
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');

  const [search, setSearch] = useState('');
  const [filterAvail, setFilterAvail] = useState([]);
  const [filterGender, setFilterGender] = useState('all');
  const [filterEth, setFilterEth] = useState([]);
  const [filterSkills, setFilterSkills] = useState([]);
  const [filterUnion, setFilterUnion] = useState([]);
  const [filterLoc, setFilterLoc] = useState([]);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(65);
  const [rateMax, setRateMax] = useState(10000);

  const [talentModal, setTalentModal] = useState(null);
  const [showAddTalent, setShowAddTalent] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);

  const fetchTalents = useCallback(async () => {
    setLoading(true);
    const data = await getTalents();
    const mapped = data?.map(t => ({
      ...t,
      loc: t.location,
      union: t.union_status,
      eth: t.ethnicity,
      img: t.image_url
    })) || [];
    setTalent(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTalents();
  }, [fetchTalents]);

  const showToast = useCallback((msg) => {
    setToast({ msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const toggleShortlist = useCallback((id) => {
    setShortlist(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearch(''); setFilterAvail([]); setFilterGender('all'); setFilterEth([]);
    setFilterSkills([]); setFilterUnion([]); setFilterLoc([]);
    setAgeMin(18); setAgeMax(65); setRateMax(10000);
  }, []);

  const filteredTalent = useMemo(() => {
    let data = talent.filter(t => {
      if (search) {
        const q = search.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !t.skills.some(s => s.toLowerCase().includes(q))) return false;
      }
      if (t.age < ageMin || t.age > ageMax) return false;
      if (t.rate > rateMax) return false;
      if (filterAvail.length && !filterAvail.includes(t.status)) return false;
      if (filterGender !== 'all' && t.gender !== filterGender) return false;
      if (filterEth.length && !filterEth.includes(t.eth)) return false;
      if (filterSkills.length && !filterSkills.some(s => t.skills.includes(s))) return false;
      if (filterUnion.length && !filterUnion.includes(t.union)) return false;
      if (filterLoc.length && !filterLoc.includes(t.loc)) return false;
      return true;
    });
    if (sortBy === 'name')   data.sort((a,b) => a.name.localeCompare(b.name));
    if (sortBy === 'rating') data.sort((a,b) => b.rating - a.rating);
    if (sortBy === 'age')    data.sort((a,b) => a.age - b.age);
    if (sortBy === 'recent') data.sort((a,b) => b.id - a.id);
    return data;
  }, [talent, search, ageMin, ageMax, rateMax, filterAvail, filterGender, filterEth, filterSkills, filterUnion, filterLoc, sortBy]);

  const activeFilters = useMemo(() => {
    const tags = [];
    filterAvail.forEach(v => tags.push({ key: 'avail:'+v, label: v === 'available' ? 'Available' : v === 'hold' ? 'On Hold' : 'Booked', remove: () => setFilterAvail(p => p.filter(x => x !== v)) }));
    if (filterGender !== 'all') tags.push({ key: 'gender', label: filterGender.charAt(0).toUpperCase()+filterGender.slice(1), remove: () => setFilterGender('all') });
    filterEth.forEach(v => tags.push({ key: 'eth:'+v, label: v, remove: () => setFilterEth(p => p.filter(x => x !== v)) }));
    filterSkills.forEach(v => tags.push({ key: 'skill:'+v, label: v, remove: () => setFilterSkills(p => p.filter(x => x !== v)) }));
    filterUnion.forEach(v => tags.push({ key: 'union:'+v, label: UNION_LABELS[v] || v, remove: () => setFilterUnion(p => p.filter(x => x !== v)) }));
    filterLoc.forEach(v => tags.push({ key: 'loc:'+v, label: LOC_LABELS[v] || v, remove: () => setFilterLoc(p => p.filter(x => x !== v)) }));
    if (ageMin !== 18 || ageMax !== 65) tags.push({ key: 'age', label: `Age ${ageMin}–${ageMax}`, remove: () => { setAgeMin(18); setAgeMax(65); } });
    if (rateMax !== 10000) tags.push({ key: 'rate', label: `≤ $${rateMax.toLocaleString()}/day`, remove: () => setRateMax(10000) });
    return tags;
  }, [filterAvail, filterGender, filterEth, filterSkills, filterUnion, filterLoc, ageMin, ageMax, rateMax]);

  return (
    <AppContext.Provider value={{
      talent, loading, filteredTalent, shortlist, toggleShortlist,
      activeNav, setActiveNav, sidebarExpanded, setSidebarExpanded,
      viewMode, setViewMode, sortBy, setSortBy,
      search, setSearch, filterAvail, setFilterAvail, filterGender, setFilterGender,
      filterEth, setFilterEth, filterSkills, setFilterSkills, filterUnion, setFilterUnion,
      filterLoc, setFilterLoc, ageMin, setAgeMin, ageMax, setAgeMax,
      rateMax, setRateMax, clearFilters, activeFilters,
      talentModal, setTalentModal, showAddTalent, setShowAddTalent,
      showNewProject, setShowNewProject,
      refreshTalents: fetchTalents, toast, showToast
    }}>
      {children}
    </AppContext.Provider>
  );
}
