import React from 'react';
import { NavLink } from 'react-router-dom';

export default function TalentSidebar() {
  const navItems = [
    { to: '/talent', exact: true, label: 'Dashboard', icon: <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
    { to: '/talent/profile', label: 'Profile', icon: <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
    { to: '/talent/media', label: 'Media', icon: <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path strokeLinecap="round" d="M3 9h18M9 21V9"/></svg> },
    { to: '/talent/castings', label: 'Castings', badge: '8', icon: <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> },
    { to: '/talent/schedule', label: 'Schedule', icon: <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18"/></svg> },
    { to: '/talent/messages', label: 'Messages', badge: '6', icon: <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg> },
    { to: '/talent/account', label: 'Account', icon: <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg> }
  ];

  return (
    <nav className="w-[68px] glass-sidebar flex flex-col items-center py-0 flex-shrink-0 relative z-10">
      {/* Logo mark */}
      <div className="w-full flex items-center justify-center pt-4 pb-3 border-b border-white/10">
        <div className="w-[34px] h-[34px] bg-white/15 rounded-[10px] flex items-center justify-center">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        </div>
      </div>

      {/* Nav */}
      <div className="flex flex-col gap-0.5 w-full px-2 py-2.5 flex-1">
        {navItems.map((item, idx) => (
          <NavLink
            key={idx}
            to={item.to}
            end={item.exact}
            className={({ isActive }) => 
              `w-full flex flex-col items-center justify-center py-[9px] px-1.5 rounded-[10px] cursor-pointer gap-1 transition-colors relative ` +
              (isActive 
                ? 'bg-white/15 text-white' 
                : 'text-white/40 hover:bg-white/10 hover:text-white/85')
            }
          >
            <div className="w-[22px] h-[22px] flex items-center justify-center">
              {item.icon}
            </div>
            <span className="text-[9px] font-semibold tracking-[0.02em] leading-none">{item.label}</span>
            {item.badge && (
              <div className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-navy-900 leading-none">
                {item.badge}
              </div>
            )}
          </NavLink>
        ))}
      </div>

      {/* Profile snippet */}
      <div className="w-full py-3 border-t border-white/10 flex flex-col items-center gap-1.5 mt-auto">
        <div className="relative inline-block">
          <img src="https://randomuser.me/api/portraits/women/44.jpg"
            className="w-[38px] h-[38px] rounded-full object-cover object-top border-2 border-white/25"
            alt="Mia Chen"
            onError={(e) => { e.target.src='https://ui-avatars.com/api/?name=Mia+Chen&background=fff&color=1a237e&size=80&bold=true'; }} />
          <div className="absolute bottom-px right-px w-[9px] h-[9px] bg-green-500 rounded-full border-[1.5px] border-navy-900 animate-pulse"></div>
        </div>
        <span className="text-[9px] font-semibold text-white/50 tracking-[0.04em]">Online</span>
      </div>
    </nav>
  );
}
