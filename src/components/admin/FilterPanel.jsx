import React, { useState, useMemo, useCallback } from 'react';
import { useSearch } from '../../context/SearchContext';
import { HEIGHT_DEFAULT_RANGE } from '../../utils/queryCompiler';
import { AVAILABILITY_OPTIONS } from '../../constants/talentOptions';
import { formatInchesToFeet } from '../../utils/heightFormat';
import Combobox from './Combobox';
import Icon from '../shared/Icon';

// ── Height dropdown options (total inches, 4'0" – 7'0") ──
const HEIGHT_OPTIONS = [];
for (let i = 48; i <= 84; i++) HEIGHT_OPTIONS.push({ value: i, label: formatInchesToFeet(i) });

// ── Static dictionaries ──
const GENDER_OPTIONS = [
  { label: 'Female', value: 'Female' },
  { label: 'Male', value: 'Male' },
  { label: 'Non-binary', value: 'Non-binary' },
  { label: 'Transgender', value: 'Transgender' },
  { label: 'Other', value: 'Other' },
];
const UNION_STATUS_OPTIONS = [
  { label: 'Non-Union', value: 'Non-Union' },
  { label: 'ACTRA', value: 'ACTRA' },
  { label: 'SAG-AFTRA', value: 'SAG-AFTRA' },
  { label: 'Equity', value: 'Equity' },
];
const HAIR_COLOR_OPTIONS = ['Black','Brown','Blonde','Red','Grey','White','Bald','Other'];
const HAIR_LENGTH_OPTIONS = ['Short','Medium','Long','Shaved','Bald'];
const EYE_COLOR_OPTIONS = ['Brown','Blue','Green','Hazel','Grey','Other'];
const PROVINCE_OPTIONS = ['ON','BC','AB','QC','MB','SK','NS','NB','PE','NL'];
const TRANSPORTATION_OPTIONS = ['Car','Truck','Motorcycle','Bicycle','Transit','None'];

// ── Reusable subcomponents (outside main component to prevent remounts) ──

const ChevronIcon = ({ isOpen }) => (
  <svg width="12" height="12" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"
    className={`transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
    <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const Section = ({ id, title, isOpen, onToggle, count, children }) => {
  const contentId = `filter-section-${id}`;
  return (
    <div className="border-t border-slate-100">
      <button
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="flex items-center justify-between w-full px-4 py-3 text-left group"
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
          {title}
          {count > 0 && <span className="ml-1.5 text-navy-700">({count})</span>}
        </p>
        <ChevronIcon isOpen={isOpen} />
      </button>
      {isOpen && <div id={contentId} className="px-4 pb-3.5">{children}</div>}
    </div>
  );
};

const CheckRow = ({ label, checked, onChange, disabled }) => (
  <label className={`flex items-center gap-2.5 group py-0.5 ${!disabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
    <input type="checkbox" className="custom-cb" checked={checked} onChange={onChange} disabled={disabled} />
    <span className="text-[13px] text-slate-600 group-hover:text-slate-900 transition-colors flex-1">{label}</span>
  </label>
);

const ResourceError = ({ resource, label, state, errors, onRetry }) => {
  if (state[resource] !== 'error') return null;
  return (
    <div className="mx-4 mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-red-700 truncate">{label} failed to load</p>
        {errors[resource] && <p className="text-[10px] text-red-500 truncate">{errors[resource]}</p>}
      </div>
      <button onClick={() => onRetry(resource)}
        className="flex-shrink-0 text-[10px] font-bold text-red-700 bg-red-100 hover:bg-red-200 rounded px-2 py-1 transition-colors">
        Retry
      </button>
    </div>
  );
};

const LoadingPlaceholder = () => (
  <div className="flex items-center gap-2 py-2">
    <svg className="animate-spin h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <span className="text-xs text-slate-400">Loading…</span>
  </div>
);

// ── Main component ──

export default function FilterPanel() {
  const {
    state, setSearch, setAgeRange, setHeightRange, setWeightRange,
    setDates, toggleFacet, clearFilters, activeFilters,
    refData, isSearchEngineReady, refDataState, refDataErrors, retryResource,
  } = useSearch();

  const [open, setOpen] = useState({
    search: true, verification: true, availability: false, dates: false,
    age: true, height: false, weight: false, gender: true, union: false,
    appearance: false, location: false, sizes: false, logistics: false,
    skills: false, languages: false, ethnicities: false,
  });
  const toggle = useCallback((key) => setOpen(prev => ({ ...prev, [key]: !prev[key] })), []);

  // ── Date mode: 'exact' | 'range' ──
  const [dateUI, setDateUI] = useState((state.dates?.from || state.dates?.to) ? 'range' : 'exact');

  // ── Memoized section counts ──
  const counts = useMemo(() => {
    const s = state;
    const f = s.facets || {};
    const rangeActive = (key, defaults) => (s.range?.[key]?.[0] !== defaults[0] || s.range?.[key]?.[1] !== defaults[1]) ? 1 : 0;
    const facetCount = (key) => (f[key] || []).length;
    const dateCount = (s.dates?.exact || (s.dates?.from && s.dates?.to)) ? 1 : 0;
    return {
      search: (s.search && s.search.length >= 2) ? 1 : 0,
      verification: facetCount('verification_status'),
      availability: facetCount('availability'),
      dates: dateCount,
      age: rangeActive('age', [18, 65]),
      height: rangeActive('height', HEIGHT_DEFAULT_RANGE),
      weight: rangeActive('weight', [100, 300]),
      gender: facetCount('gender'),
      union: facetCount('union_status'),
      appearance: facetCount('hair_color') + facetCount('hair_length') + facetCount('eye_color'),
      location: facetCount('province'),
      sizes: facetCount('shirt_size') + facetCount('pant_size') + facetCount('hat_size') + facetCount('shoe_size'),
      logistics: facetCount('transportation'),
      skills: facetCount('skills'),
      languages: facetCount('languages'),
      ethnicities: facetCount('ethnicities'),
    };
  }, [state]);

  const dis = !isSearchEngineReady;

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <Icon name="filter" size={14} color="#0f172a" />
          <span className="text-sm font-bold text-slate-800">Filters</span>
          {!isSearchEngineReady && (
            <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Init…
            </span>
          )}
        </div>
        {activeFilters.length > 0 && (
          <button onClick={clearFilters} className="text-xs text-navy-700 font-semibold hover:underline transition-colors">
            Clear ({activeFilters.length})
          </button>
        )}
      </div>

      <ResourceError resource="skills" label="Skills" state={refDataState} errors={refDataErrors} onRetry={retryResource} />
      <ResourceError resource="languages" label="Languages" state={refDataState} errors={refDataErrors} onRetry={retryResource} />
      <ResourceError resource="ethnicities" label="Ethnicities" state={refDataState} errors={refDataErrors} onRetry={retryResource} />
      <ResourceError resource="userSkills" label="Skill data" state={refDataState} errors={refDataErrors} onRetry={retryResource} />

      <div className="overflow-y-auto flex-1">

        {/* ── Search ── */}
        <Section id="search" title="Search" isOpen={open.search} onToggle={toggle} count={counts.search}>
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="13" height="13" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4-4" />
            </svg>
            <input type="text" value={state.search} onChange={e => setSearch(e.target.value)}
              placeholder={dis ? 'Initializing…' : 'Name, keyword…'} disabled={dis}
              className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-navy-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" />
            {state.search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </Section>

        {/* ── Verification ── */}
        <Section id="verification" title="Verification" isOpen={open.verification} onToggle={toggle} count={counts.verification}>
          <div className="flex flex-col gap-1">
            <CheckRow label="Verified Profiles" checked={state.facets.verification_status?.includes('verified')} onChange={() => toggleFacet('verification_status', 'verified')} disabled={dis} />
            <CheckRow label="Unverified Profiles" checked={state.facets.verification_status?.includes('unverified')} onChange={() => toggleFacet('verification_status', 'unverified')} disabled={dis} />
          </div>
        </Section>

        {/* ── Availability ── */}
        <Section id="availability" title="Availability" isOpen={open.availability} onToggle={toggle} count={counts.availability}>
          <div className="flex flex-col gap-1.5">
            {AVAILABILITY_OPTIONS.map(opt => {
              const active = state.facets.availability?.includes(opt);
              return (
                <button key={opt} onClick={() => toggleFacet('availability', opt)} disabled={dis}
                  className={`text-xs py-1.5 px-3 rounded-lg border font-semibold transition-all text-left capitalize disabled:opacity-50 disabled:cursor-not-allowed
                    ${active ? 'bg-navy-50 border-navy-700 text-navy-900' : 'border-slate-200 text-slate-500 hover:border-navy-300'}`}>
                  {opt}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Dates ── */}
        <Section id="dates" title="Dates" isOpen={open.dates} onToggle={toggle} count={counts.dates}>
          <div className="space-y-3">
            <div className="flex gap-1">
              {['exact', 'range'].map(m => (
                <button key={m} disabled={dis}
                  onClick={() => {
                    setDateUI(m);
                    setDates({ exact: null, from: null, to: null, window_days: 7 });
                  }}
                  className={`flex-1 text-[10px] font-bold py-1.5 rounded-md border transition-all uppercase tracking-wide disabled:opacity-50
                    ${dateUI === m ? 'bg-navy-50 border-navy-700 text-navy-900' : 'border-slate-200 text-slate-400 hover:border-navy-300'}`}>
                  {m === 'exact' ? 'Exact Date' : 'Date Range'}
                </button>
              ))}
            </div>
            {dateUI === 'exact' ? (
              <div>
                <p className="text-[10px] text-slate-400 mb-1">Select date</p>
                <input type="date" value={state.dates?.exact || ''} disabled={dis}
                  onChange={e => setDates({ exact: e.target.value || null, from: null, to: null, window_days: 7 })}
                  className="w-full h-7 px-2 text-xs border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-navy-400 disabled:opacity-50" />
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 mb-1">From</p>
                  <input type="date" value={state.dates?.from || ''} disabled={dis}
                    onChange={e => setDates({ exact: null, from: e.target.value || null, to: state.dates?.to || null, window_days: 7 })}
                    className="w-full h-7 px-2 text-xs border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-navy-400 disabled:opacity-50" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 mb-1">To</p>
                  <input type="date" value={state.dates?.to || ''} disabled={dis}
                    onChange={e => setDates({ exact: null, from: state.dates?.from || null, to: e.target.value || null, window_days: 7 })}
                    className="w-full h-7 px-2 text-xs border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-navy-400 disabled:opacity-50" />
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* ── Age Range ── */}
        <Section id="age" title="Age Range" isOpen={open.age} onToggle={toggle} count={counts.age}>
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-semibold text-navy-700 mb-1">
              <span>Min: {state.range.age[0]}</span>
              <span>Max: {state.range.age[1]}</span>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 mb-1">Minimum Age</p>
              <input type="range" min={18} max={70} value={state.range.age[0]} disabled={dis}
                onChange={e => setAgeRange([Math.min(+e.target.value, state.range.age[1] - 1), state.range.age[1]])} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 mb-1">Maximum Age</p>
              <input type="range" min={18} max={70} value={state.range.age[1]} disabled={dis}
                onChange={e => setAgeRange([state.range.age[0], Math.max(+e.target.value, state.range.age[0] + 1)])} />
            </div>
          </div>
        </Section>

        {/* ── Height Range ── */}
        <Section id="height" title="Height" isOpen={open.height} onToggle={toggle} count={counts.height}>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-navy-700 mb-1">
              <span>{formatInchesToFeet(state.range.height[0])}</span>
              <span>{formatInchesToFeet(state.range.height[1])}</span>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 mb-1">Min Height</p>
              <select value={state.range.height[0]} disabled={dis}
                onChange={e => setHeightRange([+e.target.value, Math.max(+e.target.value, state.range.height[1])])}
                className="w-full h-7 px-2 text-xs border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-navy-400 disabled:opacity-50 bg-white">
                {HEIGHT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 mb-1">Max Height</p>
              <select value={state.range.height[1]} disabled={dis}
                onChange={e => setHeightRange([Math.min(state.range.height[0], +e.target.value), +e.target.value])}
                className="w-full h-7 px-2 text-xs border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-navy-400 disabled:opacity-50 bg-white">
                {HEIGHT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </Section>

        {/* ── Weight Range ── */}
        <Section id="weight" title="Weight" isOpen={open.weight} onToggle={toggle} count={counts.weight}>
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-semibold text-navy-700 mb-1">
              <span>Min: {state.range.weight[0]} lbs</span>
              <span>Max: {state.range.weight[1]} lbs</span>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 mb-1">Minimum Weight</p>
              <input type="range" min={80} max={350} step={5} value={state.range.weight[0]} disabled={dis}
                onChange={e => setWeightRange([Math.min(+e.target.value, state.range.weight[1] - 5), state.range.weight[1]])} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 mb-1">Maximum Weight</p>
              <input type="range" min={80} max={350} step={5} value={state.range.weight[1]} disabled={dis}
                onChange={e => setWeightRange([state.range.weight[0], Math.max(+e.target.value, state.range.weight[0] + 5)])} />
            </div>
          </div>
        </Section>

        {/* ── Gender ── */}
        <Section id="gender" title="Gender" isOpen={open.gender} onToggle={toggle} count={counts.gender}>
          <div className="grid grid-cols-2 gap-1.5">
            {GENDER_OPTIONS.map(g => {
              const active = state.facets.gender?.includes(g.value);
              return (
                <button key={g.value} onClick={() => toggleFacet('gender', g.value)} disabled={dis}
                  className={`text-xs py-1.5 rounded-lg border font-semibold transition-all capitalize disabled:opacity-50 disabled:cursor-not-allowed
                    ${active ? 'bg-navy-50 border-navy-700 text-navy-900' : 'border-slate-200 text-slate-500 hover:border-navy-300'}`}>
                  {g.label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Union Status ── */}
        <Section id="union" title="Union Status" isOpen={open.union} onToggle={toggle} count={counts.union}>
          <div className="flex flex-col gap-1">
            {UNION_STATUS_OPTIONS.map(u => (
              <CheckRow key={u.value} label={u.label} checked={state.facets.union_status?.includes(u.value)} onChange={() => toggleFacet('union_status', u.value)} disabled={dis} />
            ))}
          </div>
        </Section>

        {/* ── Appearance ── */}
        <Section id="appearance" title="Appearance" isOpen={open.appearance} onToggle={toggle} count={counts.appearance}>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-1">Hair Color</p>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {HAIR_COLOR_OPTIONS.map(h => (
                  <CheckRow key={h} label={h} checked={state.facets.hair_color?.includes(h)} onChange={() => toggleFacet('hair_color', h)} disabled={dis} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-1">Hair Length</p>
              <div className="flex flex-col gap-1">
                {HAIR_LENGTH_OPTIONS.map(h => (
                  <CheckRow key={h} label={h} checked={state.facets.hair_length?.includes(h)} onChange={() => toggleFacet('hair_length', h)} disabled={dis} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-1">Eye Color</p>
              <div className="flex flex-col gap-1">
                {EYE_COLOR_OPTIONS.map(e => (
                  <CheckRow key={e} label={e} checked={state.facets.eye_color?.includes(e)} onChange={() => toggleFacet('eye_color', e)} disabled={dis} />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Location ── */}
        <Section id="location" title="Location" isOpen={open.location} onToggle={toggle} count={counts.location}>
          <div className="grid grid-cols-3 gap-1.5">
            {PROVINCE_OPTIONS.map(p => {
              const active = state.facets.province?.includes(p);
              return (
                <button key={p} onClick={() => toggleFacet('province', p)} disabled={dis}
                  className={`text-xs py-1.5 rounded-lg border font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed
                    ${active ? 'bg-navy-50 border-navy-700 text-navy-900' : 'border-slate-200 text-slate-500 hover:border-navy-300'}`}>
                  {p}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Wardrobe Sizes ── */}
        <Section id="sizes" title="Wardrobe Sizes" isOpen={open.sizes} onToggle={toggle} count={counts.sizes}>
          <div className="space-y-2">
            {['shirt_size','pant_size','hat_size','shoe_size'].map(sizeKey => {
              const label = sizeKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              return (
                <div key={sizeKey}>
                  <p className="text-[10px] text-slate-400 mb-1">{label}</p>
                  <input type="text" value={state.facets[sizeKey]?.[0] || ''} disabled={dis}
                    onChange={e => {
                      const val = e.target.value;
                      if (!val) { if (state.facets[sizeKey]?.length) toggleFacet(sizeKey, state.facets[sizeKey][0]); }
                      else { if (state.facets[sizeKey]?.length) toggleFacet(sizeKey, state.facets[sizeKey][0]); toggleFacet(sizeKey, val); }
                    }}
                    placeholder={`e.g. ${sizeKey === 'shoe_size' ? '10.5' : 'L'}`}
                    className="w-full h-7 px-2 text-xs border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-navy-400 disabled:opacity-50" />
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── Logistics ── */}
        <Section id="logistics" title="Logistics" isOpen={open.logistics} onToggle={toggle} count={counts.logistics}>
          <div className="flex flex-col gap-1">
            {TRANSPORTATION_OPTIONS.map(t => (
              <CheckRow key={t} label={t} checked={state.facets.transportation?.includes(t)} onChange={() => toggleFacet('transportation', t)} disabled={dis} />
            ))}
          </div>
        </Section>

        {/* ── Skills ── */}
        <Section id="skills" title="Skills" isOpen={open.skills} onToggle={toggle} count={counts.skills}>
          {refDataState.skills === 'loading' ? <LoadingPlaceholder /> :
           refDataState.skills === 'error' ? <p className="text-xs text-red-400 italic">Failed to load skills</p> :
           <Combobox items={refData.skills} selected={state.facets.skills} onToggle={id => toggleFacet('skills', id)}
             placeholder="Search skills…" disabled={dis} />}
        </Section>

        {/* ── Languages ── */}
        <Section id="languages" title="Languages" isOpen={open.languages} onToggle={toggle} count={counts.languages}>
          {refDataState.languages === 'loading' ? <LoadingPlaceholder /> :
           refDataState.languages === 'error' ? <p className="text-xs text-red-400 italic">Failed to load languages</p> :
           <Combobox items={refData.languages} selected={state.facets.languages} onToggle={id => toggleFacet('languages', id)}
             placeholder="Search languages…" disabled={dis} />}
        </Section>

        {/* ── Ethnicities ── */}
        <Section id="ethnicities" title="Ethnicities" isOpen={open.ethnicities} onToggle={toggle} count={counts.ethnicities}>
          {refDataState.ethnicities === 'loading' ? <LoadingPlaceholder /> :
           refDataState.ethnicities === 'error' ? <p className="text-xs text-red-400 italic">Failed to load ethnicities</p> :
           <Combobox items={refData.ethnicities} selected={state.facets.ethnicities} onToggle={id => toggleFacet('ethnicities', id)}
             placeholder="Search ethnicities…" disabled={dis} />}
        </Section>

        <div className="h-4" />
      </div>
    </aside>
  );
}
