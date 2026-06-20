import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Icon from '../shared/Icon';

function NavItem({ item, active, onClick }) {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`w-full flex items-center h-10 px-2.5 rounded-xl transition-all gap-3
          ${active ? 'bg-white/15 text-white' : 'text-white/55 hover:bg-white/10 hover:text-white/90'}`}
      >
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          <Icon name={item.icon} size={19} color="currentColor" />
        </div>
        <span className="text-sm font-medium whitespace-nowrap opacity-0 max-w-0 overflow-hidden transition-all duration-300 group-hover:opacity-100 group-hover:max-w-xs">
          {item.label}
        </span>
        {item.badge && (
          <span className="flex-shrink-0 ml-auto min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-navy-900 absolute top-1.5 right-1.5 group-hover:static group-hover:top-auto group-hover:right-auto">
            {item.badge}
          </span>
        )}
      </button>
    </div>
  );
}

export default function AdminSidebar() {
  const { activeNav, setActiveNav } = useContext(AppContext);
  const { profile } = useAuth();

  const navItems = [
    { id:'demographics',  icon:'user',      label:'Demographics' },
    { id:'appearance',    icon:'eye',       label:'Appearance' },
    { id:'location',      icon:'map',       label:'Location' },
    { id:'union',         icon:'shield',    label:'Union' },
    { id:'availability',  icon:'calendar',  label:'Availability' },
    { id:'measurements',  icon:'ruler',     label:'Measurements' },
    { id:'vehicle',       icon:'car',       label:'Vehicle' },
    { id:'skills',        icon:'star',      label:'Skills' },
    { id:'ai-insights',   icon:'sparkles',  label:'AI Insights' },
  ];

  const handleNavClick = (id) => {
    // Toggle: clicking same item closes the drawer
    setActiveNav(prev => prev === id ? null : id);
  };

  return (
    <aside className="flex flex-col bg-navy-900 h-full flex-1 overflow-hidden">
      {/* Logo */}
      <div className="flex items-center h-14 border-b border-white/10 px-3 flex-shrink-0">
        <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon name="users" size={16} color="white" />
        </div>
        <span className="ml-2.5 font-bold text-white text-sm tracking-tight whitespace-nowrap opacity-0 max-w-0 overflow-hidden transition-all duration-300 group-hover:opacity-100 group-hover:max-w-[200px]">
          CastingHub
        </span>
      </div>

      {/* Filter Group Nav */}
      <nav className="flex flex-col gap-0.5 pt-2 px-2 flex-1 overflow-y-auto">
        {navItems.map(item => (
          <NavItem key={item.id} item={item} active={activeNav === item.id}
            onClick={() => handleNavClick(item.id)} />
        ))}
      </nav>

      {/* Divider */}
      <div className="border-t border-white/10 mx-3" />

      {/* Bottom: Settings */}
      <div className="flex flex-col gap-0.5 px-2 py-2">
        <NavItem item={{ id:'settings', icon:'settings', label:'Settings' }}
          active={activeNav === 'settings'}
          onClick={() => handleNavClick('settings')} />
      </div>

      {/* Profile snippet */}
      <div className="border-t border-white/10 p-3 flex items-center gap-2.5">
        <img
          src={profile?.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent((profile?.first_name || 'U') + '+' + (profile?.last_name || ''))}&background=4f5fdd&color=fff&size=64&bold=true`}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          alt="admin"
        />
        <div className="opacity-0 max-w-0 overflow-hidden transition-all duration-300 group-hover:opacity-100 group-hover:max-w-[200px]">
          <p className="text-xs font-bold text-white truncate leading-tight">{profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Admin'}</p>
          <p className="text-[10px] text-white/50 truncate">{profile?.role || 'Agent'}</p>
        </div>
      </div>
    </aside>
  );
}
