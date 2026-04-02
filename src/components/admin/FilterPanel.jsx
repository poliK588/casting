import React, { useContext, useCallback } from 'react';
import { AppContext, LOC_LABELS, UNION_LABELS } from '../../context/AppContext';
import Icon from '../shared/Icon';

function useToggleArray(state, setState) {
  return useCallback((val) => {
    setState(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  }, [setState]);
}

export default function FilterPanel() {
  const {
    filterAvail, setFilterAvail, filterGender, setFilterGender,
    filterEth, setFilterEth, filterSkills, setFilterSkills,
    filterUnion, setFilterUnion, filterLoc, setFilterLoc,
    ageMin, setAgeMin, ageMax, setAgeMax, rateMax, setRateMax,
    clearFilters, activeFilters,
  } = useContext(AppContext);

  const toggleAvail = useToggleArray(filterAvail, setFilterAvail);
  const toggleEth   = useToggleArray(filterEth, setFilterEth);
  const toggleSkill = useToggleArray(filterSkills, setFilterSkills);
  const toggleUnion = useToggleArray(filterUnion, setFilterUnion);
  const toggleLoc   = useToggleArray(filterLoc, setFilterLoc);

  const Section = ({ title, children }) => (
    <div className="border-t border-slate-100 px-4 py-3.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">{title}</p>
      {children}
    </div>
  );

  const CheckRow = ({ label, count, checked, onChange }) => (
    <label className="flex items-center gap-2.5 cursor-pointer group py-0.5">
      <input type="checkbox" className="custom-cb" checked={checked} onChange={onChange} />
      <span className="text-[13px] text-slate-600 group-hover:text-slate-900 transition-colors flex-1">{label}</span>
      {count !== undefined && <span className="text-[11px] text-slate-400">{count}</span>}
    </label>
  );

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <Icon name="filter" size={14} color="#0f172a" />
          <span className="text-sm font-bold text-slate-800">Filters</span>
        </div>
        {activeFilters.length > 0 && (
          <button onClick={clearFilters} className="text-xs text-navy-700 font-semibold hover:underline transition-colors">
            Clear all ({activeFilters.length})
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {/* Active filter tags */}
        {activeFilters.length > 0 && (
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex flex-wrap gap-1.5">
              {activeFilters.map(f => (
                <button key={f.key} onClick={f.remove}
                  className="flex items-center gap-1 px-2 py-0.5 bg-navy-100 text-navy-800 rounded-full text-[11px] font-semibold hover:bg-navy-200 transition-colors">
                  {f.label}
                  <Icon name="close" size={10} color="currentColor" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Availability */}
        <Section title="Availability">
          <div className="flex flex-col gap-1">
            <CheckRow label="Available Now" count={124} checked={filterAvail.includes('available')} onChange={() => toggleAvail('available')} />
            <CheckRow label="On Hold" count={38} checked={filterAvail.includes('hold')} onChange={() => toggleAvail('hold')} />
            <CheckRow label="Booked Out" count={19} checked={filterAvail.includes('busy')} onChange={() => toggleAvail('busy')} />
          </div>
        </Section>

        {/* Age Range */}
        <Section title="Age Range">
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-semibold text-navy-700 mb-1">
              <span>Min: {ageMin}</span>
              <span>Max: {ageMax}</span>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 mb-1">Minimum Age</p>
              <input type="range" min={18} max={70} value={ageMin}
                onChange={e => setAgeMin(Math.min(+e.target.value, ageMax - 1))} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 mb-1">Maximum Age</p>
              <input type="range" min={18} max={70} value={ageMax}
                onChange={e => setAgeMax(Math.max(+e.target.value, ageMin + 1))} />
            </div>
          </div>
        </Section>

        {/* Gender */}
        <Section title="Gender">
          <div className="grid grid-cols-3 gap-1.5">
            {['all','female','male'].map(g => (
              <button key={g} onClick={() => setFilterGender(g)}
                className={`text-xs py-1.5 rounded-lg border font-semibold transition-all capitalize
                  ${filterGender === g
                    ? 'bg-navy-50 border-navy-700 text-navy-900'
                    : 'border-slate-200 text-slate-500 hover:border-navy-300'}`}>
                {g === 'all' ? 'All' : g.charAt(0).toUpperCase()+g.slice(1)}
              </button>
            ))}
          </div>
        </Section>

        {/* Ethnicity */}
        <Section title="Ethnicity">
          <div className="flex flex-col gap-1">
            {[['caucasian','Caucasian'],['hispanic','Hispanic / Latino'],['black','Black / African'],
              ['asian','Asian'],['southasian','South Asian'],['middleeastern','Middle Eastern']].map(([v,l]) => (
              <CheckRow key={v} label={l} checked={filterEth.includes(v)} onChange={() => toggleEth(v)} />
            ))}
          </div>
        </Section>

        {/* Skills */}
        <Section title="Skills & Specialties">
          <div className="flex flex-col gap-1">
            {[['Acting',89],['Dancing',54],['Singing',42],['Stunts',17],
              ['Voice-Over',31],['Commercial',66],['Runway',28],['Improv',22]].map(([s,c]) => (
              <CheckRow key={s} label={s} count={c} checked={filterSkills.includes(s)} onChange={() => toggleSkill(s)} />
            ))}
          </div>
        </Section>

        {/* Union */}
        <Section title="Union Status">
          <div className="flex flex-col gap-1">
            {[['sag','SAG-AFTRA',74],['afm','AFM',18],['equity','AEA (Equity)',29],['nonunion','Non-Union',60]].map(([v,l,c]) => (
              <CheckRow key={v} label={l} count={c} checked={filterUnion.includes(v)} onChange={() => toggleUnion(v)} />
            ))}
          </div>
        </Section>

        {/* Location */}
        <Section title="Location / Market">
          <div className="flex flex-col gap-1">
            {[['la','Los Angeles',88],['nyc','New York',61],['chi','Chicago',23],['atl','Atlanta',19],['aus','Austin',14]].map(([v,l,c]) => (
              <CheckRow key={v} label={l} count={c} checked={filterLoc.includes(v)} onChange={() => toggleLoc(v)} />
            ))}
          </div>
        </Section>

        {/* Daily Rate */}
        <Section title="Max Daily Rate">
          <div>
            <div className="text-right text-xs font-bold text-navy-700 mb-1.5">
              Up to ${rateMax.toLocaleString()}
            </div>
            <input type="range" min={500} max={10000} step={100} value={rateMax}
              onChange={e => setRateMax(+e.target.value)} />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>$500</span><span>$10,000</span>
            </div>
          </div>
        </Section>

        <div className="h-4" />
      </div>
    </aside>
  );
}
