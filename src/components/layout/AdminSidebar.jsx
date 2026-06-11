import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Icon from './Icon';

function NavItem({ item, active, expanded, onClick }) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>
      <button
        onClick={onClick}
        className={`w-full flex items-center h-10 px-2.5 rounded-xl transition-all gap-3 group
          ${active ? 'bg-white/15 text-white' : 'text-white/55 hover:bg-white/10 hover:text-white/90'}`}
      >
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          <Icon name={item.icon} size={19} color="currentColor" />
        </div>
        <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${expanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}`}>
          {item.label}
        </span>
        {item.badge && (
          <span className={`flex-shrink-0 ml-auto min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-navy-900 ${expanded ? '' : 'absolute top-1.5 right-1.5'}`}>
            {item.badge}
          </span>
        )}
      </button>
      {!expanded && showTip && (
        <div className="nav-tooltip absolute left-[72px] top-1/2 -translate-y-1/2 bg-navy-900 border border-white/10 text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap z-50">
          {item.label}
          {item.badge && <span className="ml-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full px-1">{item.badge}</span>}
        </div>
      )}
    </div>
  );
}

export default function AdminSidebar() {
  const { activeNav, setActiveNav, sidebarExpanded } = useContext(AppContext);
  const { profile } = useAuth();
  const navItems = [
    { id:'dashboard', icon:'grid',     label:'Dashboard' },
    { id:'projects',  icon:'folder',   label:'Projects',   badge: 3 },
    { id:'scout',     icon:'search2',  label:'Talent Scout' },
    { id:'schedule',  icon:'calendar', label:'Schedule' },
    { id:'submissions',icon:'document',label:'Submissions', badge: 7 },
    { id:'analytics', icon:'chart',    label:'Analytics' },
  ];
  return (
    <aside
      className={`flex flex-col bg-navy-900 h-full flex-shrink-0 overflow-hidden z-20 transition-all duration-300 ${sidebarExpanded ? 'w-52' : 'w-16'}`}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-14 border-b border-white/10 px-3 flex-shrink-0">
        <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon name="users" size={16} color="white" />
        </div>
        {sidebarExpanded && <span className="ml-2.5 font-bold text-white text-sm tracking-tight whitespace-nowrap overflow-hidden" style={{opacity:sidebarExpanded?1:0,transition:'opacity .2s'}}>CastingHub</span>}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 pt-2 px-2 flex-1 overflow-y-auto">
        {navItems.map(item => (
          <NavItem key={item.id} item={item} active={activeNav === item.id}
            expanded={sidebarExpanded} onClick={() => setActiveNav(item.id)} />
        ))}
      </nav>

      {/* Divider */}
      <div className="border-t border-white/10 mx-3" />

      {/* Bottom items */}
      <div className="flex flex-col gap-0.5 px-2 py-2">
        <NavItem item={{ id:'settings', icon:'settings', label:'Settings' }}
          active={activeNav === 'settings'} expanded={sidebarExpanded}
          onClick={() => setActiveNav('settings')} />
      </div>

      {/* Profile snippet */}
      <div className="border-t border-white/10 p-3 flex items-center gap-2.5">
        <img
          src={profile?.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent((profile?.first_name || 'U') + '+' + (profile?.last_name || ''))}&background=4f5fdd&color=fff&size=64&bold=true`}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          alt="admin"
        />
        {sidebarExpanded && (
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate leading-tight">{profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Admin'}</p>
            <p className="text-[10px] text-white/50 truncate">{profile?.role || 'Agent'}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
