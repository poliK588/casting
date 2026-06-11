import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { StatusBadge, UnionBadge, SkillTag } from '../shared/UIHelpers';
import Icon from '../shared/Icon';

export default function TalentCard({ talent: t }) {
  const { shortlist, toggleShortlist, setTalentModal } = useContext(AppContext);
  const inShortlist = shortlist.has(t.id);
  const [imgErr, setImgErr] = useState(false);

  const skills = t.skillNames || [];

  return (
    <div className="talent-card bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:border-slate-200 flex flex-col cursor-default">
      {/* Headshot */}
      <div className="relative overflow-hidden group" style={{ aspectRatio: '3/4' }}>
        <img
          src={imgErr ? `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=e8eaff&color=1a237e&size=400&bold=true` : t.img}
          alt={t.name}
          loading="lazy"
          onError={() => setImgErr(true)}
          className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          <StatusBadge status={t.status || 'available'} />
          <button
            onClick={() => toggleShortlist(t.id)}
            className={`w-7 h-7 rounded-full backdrop-blur-sm flex items-center justify-center shadow-sm transition-all border ${inShortlist ? 'bg-accent text-white border-accent' : 'bg-white/90 text-slate-400 border-transparent hover:bg-white hover:text-accent'}`}
            title={inShortlist ? 'Remove from shortlist' : 'Add to shortlist'}
          >
            <Icon name="starFill" size={14} color="currentColor" />
          </button>
        </div>

        {/* Quick actions on hover */}
        <div className="card-actions absolute bottom-2 left-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100">
          <button onClick={() => setTalentModal?.(t)}
            className="flex-1 flex items-center justify-center gap-1 h-7 bg-white/95 backdrop-blur-sm rounded-lg text-[11px] font-bold text-navy-900 hover:bg-white transition-colors shadow-sm">
            <Icon name="eye" size={12} color="#0f172a" /> View
          </button>
          <button
            className="w-7 h-7 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:text-navy-900 transition-colors shadow-sm">
            <Icon name="download" size={13} color="currentColor" />
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="px-3 py-2.5 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate leading-tight">{t.name}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t.age ? `${t.age} yrs` : '—'} &bull; {t.city || '—'}
            </p>
          </div>
          <UnionBadge union={t.union_status} />
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {skills.slice(0, 3).map(s => <SkillTag key={s} skill={s} />)}
            {skills.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-semibold">
                +{skills.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
