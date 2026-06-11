import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function TalentHeader() {
  const { signOut, profile } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Talent';
  const avatarUrl = profile?.image_url || null;

  return (
    <header className="flex items-center gap-3 glass-header px-6 h-14 flex-shrink-0 relative z-50">
      
      {/* Logo Area */}
      <div className="flex items-center gap-2">
        <div className="w-[30px] h-[30px] bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        </div>
        <div className="flex items-baseline">
          <span className="text-[17px] font-extrabold text-white tracking-tight">CastingHub</span>
          <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase ml-1">Talent</span>
        </div>
      </div>

      <div className="w-px h-6 bg-white/10 flex-shrink-0 ml-1"></div>

      {/* Search */}
      <div className="flex-1 max-w-[420px] relative ml-1">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4-4"/></svg>
        <input 
          type="text" 
          placeholder="Search auditions, messages, projects…" 
          className="glass-input h-[34px] !pl-9 !pr-3 !rounded-lg text-[13px] placeholder:text-slate-500"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <button className="btn-primary h-[34px] px-3.5 !py-0 !rounded-lg text-xs whitespace-nowrap leading-none">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 4v16m8-8H4"/></svg>
          Submit to Casting
        </button>
        <button className="flex items-center gap-1.5 h-[34px] px-3.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap border border-white/10 leading-none">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 4v16m8-8H4"/></svg>
          Add Media
        </button>

        <div className="w-[34px] h-[34px] flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer transition-colors relative ml-1">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          <div className="absolute top-[5px] right-[5px] w-2 h-2 bg-red-500 rounded-full border-[1.5px] border-slate-900"></div>
        </div>

        <div ref={menuRef} className="relative flex-shrink-0">
          <div
            onClick={() => setIsMenuOpen(prev => !prev)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-[10px] hover:bg-white/10 cursor-pointer transition-colors ml-1"
          >
            {avatarUrl ? (
              <img
                className="w-[30px] h-[30px] rounded-full object-cover object-top"
                src={avatarUrl}
                alt={displayName}
              />
            ) : (
              <div className="w-[30px] h-[30px] rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            )}
            <div className="flex flex-col">
              <div className="text-xs font-bold text-white leading-[1.1]">{displayName}</div>
              <div className="text-[10px] text-slate-400 leading-[1.1]">My Profile</div>
            </div>
            <svg width="12" height="12" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24" className="ml-0.5">
              <path strokeLinecap="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>

          {isMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-52 glass-panel !rounded-xl z-[100] p-0 overflow-hidden shadow-2xl border border-white/5">
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  setIsMenuOpen(false);
                  if (typeof signOut === 'function') await signOut();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-white/10 hover:text-red-300 transition-colors cursor-pointer text-left rounded-none"
              >
                <svg className="flex-shrink-0" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
    </header>
  );
}
