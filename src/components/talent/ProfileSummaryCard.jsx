import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../shared/Icon';

export default function ProfileSummaryCard({ user, editLink }) {
  return (
    <div className="glass-panel overflow-hidden lift">
      <div className="relative h-[180px] overflow-hidden bg-slate-200">
        {user.heroImg ? (
          <img src={user.heroImg} alt={user.name} className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
            <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/10 to-navy-900/70" />
        <div className="absolute top-2.5 left-2.5 z-10 flex gap-1.5">
          <span className="tag tag-green text-[10px]">Available</span>
        </div>
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="tag tag-navy text-[10px]">{user.union}</span>
        </div>
      </div>

      <div className="px-[18px] pb-[18px]">
        {user.avatar ? (
          <img
            src={user.avatar} alt={user.name}
            className="w-[72px] h-[72px] rounded-full object-cover object-top border-[3px] border-slate-800 shadow-md -mt-[36px] relative z-10"
          />
        ) : (
          <div className="w-[72px] h-[72px] rounded-full border-[3px] border-slate-800 shadow-md -mt-[36px] relative z-10 bg-slate-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
          </div>
        )}
        <div className="flex items-start justify-between mt-1">
          <div>
            <div className="text-[18px] font-[800] text-white tracking-[-0.02em] mt-1.5">{user.name}</div>
            <div className="text-[12px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>{user.age} yrs</span><span className="text-slate-600">&bull;</span>
              <span>{user.location}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-amber-500 text-[14px] tracking-[-0.5px]">★★★★★</span>
              <span className="text-[11px] font-[700] text-white">{user.rating}</span>
              <span className="text-[11px] text-slate-400">({user.credits} credits)</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 mt-2">
            <span className="flex items-center gap-1 text-[11px] font-[600] text-emerald-500">
              <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block online-pulse" />
              Online Now
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-px bg-white/5 rounded-[10px] overflow-hidden my-3.5">
          <div className="bg-white/5 p-2.5 text-center">
            <div className="text-[16px] font-[800] text-white">{user.credits}</div>
            <div className="text-[10px] text-slate-400 font-[500] mt-[1px]">Credits</div>
          </div>
          <div className="bg-white/5 p-2.5 text-center">
            <div className="text-[16px] font-[800] text-white">{user.submitted}</div>
            <div className="text-[10px] text-slate-400 font-[500] mt-[1px]">Submitted</div>
          </div>
          <div className="bg-white/5 p-2.5 text-center">
            <div className="text-[16px] font-[800] text-white">${user.rate}</div>
            <div className="text-[10px] text-slate-400 font-[500] mt-[1px]">Day Rate</div>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-[700] uppercase tracking-[0.06em] text-slate-400 mb-1.5">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {user.skills.map((s, i) => (
              <span key={i} className={`tag ${i < 3 ? 'tag-navy' : 'tag-slate'}`}>{s}</span>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <p className="text-[10px] font-[700] uppercase tracking-[0.06em] text-slate-400 mb-1.5">Languages</p>
          <div className="flex flex-wrap gap-1.5">
            {user.languages.map((l, i) => (
              <span key={i} className="tag tag-slate">{l}</span>
            ))}
          </div>
        </div>

        {editLink ? (
          <Link to={editLink} className="w-full h-9 border-[1.5px] border-white/20 rounded-[9px] flex items-center justify-center gap-1.5 text-[12px] font-[700] text-white cursor-pointer transition-colors hover:bg-white/10 mt-3.5 mt-auto no-underline">
            <Icon name="pencil" size={13} color="currentColor" />
            Edit Profile
          </Link>
        ) : (
          <button className="w-full h-9 border-[1.5px] border-white/20 rounded-[9px] flex items-center justify-center gap-1.5 text-[12px] font-[700] text-white cursor-pointer transition-colors hover:bg-white/10 mt-3.5 mt-auto">
            <Icon name="pencil" size={13} color="currentColor" />
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}
