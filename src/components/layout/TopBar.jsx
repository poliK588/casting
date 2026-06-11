import React, { useState, useRef, useContext, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import Icon from '../shared/Icon';

export default function TopBar() {
  const {
    sidebarExpanded, setSidebarExpanded,
    search, setSearch,
    setShowAddTalent, setShowNewProject,
    shortlist,
  } = useContext(AppContext);
  const { profile, signOut } = useAuth();

  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef(null);

  // Close dropdown when clicking outside — no stopPropagation needed anywhere.
  useOutsideClick(avatarRef, useCallback(() => setAvatarOpen(false), []));

  // Keyboard: Escape closes dropdown.
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && avatarOpen) setAvatarOpen(false);
  };

  const avatarSrc = profile?.image_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${profile?.first_name || 'U'} ${profile?.last_name || ''}`
    )}&background=0f172a&color=fff&size=64&bold=true`;

  const displayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ''}`.trim()
    : 'Admin';

  return (
    <header
      className="h-14 flex items-center gap-3 px-4 bg-white border-b border-slate-200 z-30 flex-shrink-0 w-full"
      onKeyDown={handleKeyDown}
    >
      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarExpanded(p => !p)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Toggle sidebar"
      >
        <Icon name="menu" size={18} color="#64748b" />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <div className="w-7 h-7 bg-navy-900 rounded-lg flex items-center justify-center">
          <Icon name="users" size={14} color="white" />
        </div>
        <span className="font-800 text-navy-900 text-base tracking-tight hidden sm:block">CastingHub</span>
        <span className="text-[10px] font-600 text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 ml-1 hidden sm:block">ADMIN</span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-lg relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon name="search" size={14} color="#94a3b8" />
        </div>
        <input
          type="text"
          placeholder="Search talent..."
          value={search || ''}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-100 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <Icon name="close" size={14} color="currentColor" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        {/* New project */}
        <button
          onClick={() => setShowNewProject(true)}
          className="hidden lg:flex items-center gap-1.5 h-8 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-600 rounded-lg transition-colors"
        >
          <Icon name="folder" size={13} color="currentColor" />
          New Project
        </button>

        {/* Add talent */}
        <button
          onClick={() => setShowAddTalent(true)}
          className="hidden sm:flex items-center gap-1.5 h-8 px-3 bg-navy-900 hover:bg-navy-800 text-white text-xs font-700 rounded-lg transition-colors"
        >
          <Icon name="plus" size={13} color="white" />
          Add Talent
        </button>

        {/* Shortlist */}
        <div className="relative">
          <button className="flex items-center gap-1.5 h-8 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-600 rounded-lg transition-colors">
            <Icon name="starFill" size={13} color="#f59e0b" />
            <span className="hidden sm:inline">Shortlist</span>
            <span className="min-w-[18px] h-[18px] bg-accent/10 text-accent text-[10px] font-800 rounded-full flex items-center justify-center px-1">
              {shortlist?.size || 0}
            </span>
          </button>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Icon name="bell" size={17} color="#64748b" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </button>
        </div>

        {/* Avatar dropdown — ref is the single source of truth for inside/outside detection */}
        <div ref={avatarRef} className="relative">
          <button
            id="avatar-menu-button"
            aria-haspopup="true"
            aria-expanded={avatarOpen}
            aria-controls="avatar-dropdown"
            onClick={() => setAvatarOpen(p => !p)}
            className="flex items-center gap-2 pl-1 pr-2 h-8 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <img
              src={avatarSrc}
              className="w-7 h-7 rounded-full object-cover"
              alt={displayName}
            />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-700 text-slate-700 leading-none">{displayName}</p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">{profile?.role || 'Agent'}</p>
            </div>
            <Icon name="chevDown" size={12} color="#94a3b8" />
          </button>

          {avatarOpen && (
            <div
              id="avatar-dropdown"
              role="menu"
              aria-labelledby="avatar-menu-button"
              className="absolute right-0 top-[calc(100%+8px)] bg-white border border-slate-200 rounded-xl shadow-xl z-50 w-52 p-0 overflow-hidden"
            >
              {[['user', 'My Profile'], ['settings', 'Settings']].map(([icon, label]) => (
                <button
                  key={label}
                  role="menuitem"
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <Icon name={icon} size={14} color="#94a3b8" /> {label}
                </button>
              ))}
              <div className="border-t border-slate-100" />
              <button
                role="menuitem"
                onClick={() => {
                  setAvatarOpen(false);
                  signOut();
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left font-medium"
              >
                <Icon name="close" size={14} color="#ef4444" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
