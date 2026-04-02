import React, { useContext, useState } from 'react';
import { AppContext, LOC_LABELS } from '../../context/AppContext';
import { StatusDot, UnionBadge, StarRating, SkillTag } from '../shared/UIHelpers';
import TalentCard from './TalentCard';
import Icon from '../shared/Icon';

function TalentListRow({ talent: t }) {
  const { shortlist, toggleShortlist, setTalentModal } = useContext(AppContext);
  const inShortlist = shortlist.has(t.id);
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className="talent-card bg-white rounded-xl border border-slate-100 shadow-sm hover:border-slate-200 flex items-center gap-4 px-4 py-3">
      <img
        src={imgErr ? `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=e8eaff&color=1a237e&size=120&bold=true` : t.img}
        alt={t.name}
        loading="lazy"
        onError={() => setImgErr(true)}
        className="w-12 h-12 rounded-xl object-cover object-top flex-shrink-0"
      />
      <div className="flex-1 min-w-0 grid items-center gap-4" style={{ gridTemplateColumns:'1.5fr 1.5fr 1fr 1fr' }}>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{t.name}</p>
          <p className="text-[11px] text-slate-400">{t.age} yrs &bull; {LOC_LABELS[t.loc] || t.loc}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {t.skills.slice(0, 3).map(s => <SkillTag key={s} skill={s} />)}
        </div>
        <div className="flex items-center gap-2">
          <StatusDot status={t.status} />
          <span className="text-xs text-slate-600">{t.status === 'available' ? 'Available' : t.status === 'hold' ? 'On Hold' : 'Booked'}</span>
          <UnionBadge union={t.union} />
        </div>
        <div className="flex items-center gap-1">
          <StarRating rating={t.rating} />
          <span className="ml-2 text-[11px] text-slate-400">{t.credits} creds</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={() => setTalentModal?.(t)}
          className="h-7 px-2.5 flex items-center gap-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 hover:text-navy-900 transition-colors">
          <Icon name="play" size={13} color="currentColor" /> Reel
        </button>
        <button className="h-7 px-2 border border-slate-200 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-50 transition-colors">
          <Icon name="download" size={13} color="currentColor" />
        </button>
        <button onClick={() => toggleShortlist(t.id)}
          className={`h-7 px-2 border rounded-lg transition-colors ${inShortlist ? 'bg-accent text-white border-accent' : 'border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-accent'}`}>
          <Icon name="starFill" size={13} color="currentColor" />
        </button>
        <button onClick={() => setTalentModal?.(t)}
          className="h-7 px-3 flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 rounded-lg text-xs text-white font-bold transition-colors">
          View Profile
        </button>
      </div>
    </div>
  );
}

export default function TalentGrid() {
  const { filteredTalent, viewMode, clearFilters, loading } = useContext(AppContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <svg className="animate-spin h-8 w-8 text-navy-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (filteredTalent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Icon name="search" size={28} color="#cbd5e1" />
        </div>
        <p className="text-sm font-bold text-slate-500">No talent matches your filters</p>
        <p className="text-xs text-slate-400 mt-1">Try adjusting or clearing your search criteria</p>
        <button onClick={clearFilters}
          className="mt-4 text-xs text-navy-700 font-bold hover:underline">
          Clear all filters
        </button>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-2 p-5">
        {filteredTalent.map(t => <TalentListRow key={t.id} talent={t} />)}
      </div>
    );
  }

  return (
    <div className="p-5 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))' }}>
      {filteredTalent.map(t => <TalentCard key={t.id} talent={t} />)}
    </div>
  );
}
