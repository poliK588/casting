import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Icon from './Icon';

export default function AdminHeader() {
  const { setSidebarExpanded, setShowAddTalent, setShowNewProject, shortlist } = useContext(AppContext);
  const { signOut, profile } = useAuth();
  const [avatarOpen, setAvatarOpen] = useState(false);

  useEffect(() => {
    const close = () => setAvatarOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  return (
    <header className="h-14 flex items-center gap-3 px-4 bg-white border-b border-slate-200 z-30 flex-shrink-0">
      <button onClick={() => setSidebarExpanded(p => !p)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
        <Icon name="menu" size={18} color="#64748b" />
      </button>

      <div className="flex items-center gap-2 mr-2">
        <div className="w-7 h-7 bg-navy-900 rounded-lg flex items-center justify-center">
          <Icon name="users" size={14} color="white" />
        </div>
        <span className="font-extrabold text-navy-900 text-base tracking-tight">CastingHub</span>
        <span className="text-[10px] font-semibold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 ml-1">ADMIN</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5 ml-auto">
        <button onClick={() => setShowNewProject?.(true)}
          className="hidden lg:flex items-center gap-1.5 h-8 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg transition-colors">
          <Icon name="folder" size={13} color="currentColor" />
          New Project
        </button>

        <button onClick={() => setShowAddTalent?.(true)}
          className="flex items-center gap-1.5 h-8 px-3 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold rounded-lg transition-colors">
          <Icon name="plus" size={13} color="white" />
          Add Talent
        </button>

        <div className="relative">
          <button className="flex items-center gap-1.5 h-8 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg transition-colors">
            <Icon name="starFill" size={13} color="#f59e0b" />
            <span>Shortlist</span>
            <span className="min-w-[18px] h-[18px] bg-blue-100 text-blue-600 text-[10px] font-extrabold rounded-full flex items-center justify-center px-1">
              {shortlist ? shortlist.size : 0}
            </span>
          </button>
        </div>

        <div className="relative">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
            <Icon name="bell" size={17} color="#64748b" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </button>
        </div>

        <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => setAvatarOpen(p => !p)}
            className="flex items-center gap-2 pl-1 pr-2 h-8 rounded-lg hover:bg-slate-100 transition-colors">
            <img src={profile?.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent((profile?.first_name || 'U') + '+' + (profile?.last_name || ''))}&background=0f172a&color=fff&size=64&bold=true`}
              className="w-7 h-7 rounded-full object-cover" alt="avatar" />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-700 leading-none">{profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Admin'}</p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">{profile?.role || 'Agent'}</p>
            </div>
            <Icon name="chevDown" size={12} color="#94a3b8" />
          </button>

          {avatarOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] bg-white border border-slate-200 rounded-xl shadow-xl z-50 w-48 py-1">
              {[['user','My Profile'],['settings','Settings']].map(([icon,label]) => (
                <button key={label} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left">
                  <Icon name={icon} size={14} color="#94a3b8" /> {label}
                </button>
              ))}
              <div className="my-1 border-t border-slate-100" />
              <button 
                onClick={signOut}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
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
