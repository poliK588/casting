import React from 'react';
import { Link } from 'react-router-dom';

/* ================================================================
   ICON COMPONENT
================================================================ */
const Icon = ({ name, size = 20, color = 'currentColor' }) => {
  const paths = {
    users: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
    user: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    folder: <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    camera: <><path strokeLinecap="round" strokeLinejoin="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></>,
    star: <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
    search: <><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" /></>,
    upload: <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />,
    chevR: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />,
    shield: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
    db: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></>,
    zap: <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className="flex-shrink-0">
      {paths[name]}
    </svg>
  );
};

/* ================================================================
   STAT PILL
================================================================ */
const StatPill = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5">
    <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
      <Icon name={icon} size={14} color="#3b82f6" />
    </div>
    <div>
      <p className="text-white text-xs font-800 leading-none">{value}</p>
      <p className="text-slate-400 text-[10px] font-500 mt-0.5">{label}</p>
    </div>
  </div>
);

/* ================================================================
   FEATURE ITEM
================================================================ */
const Feature = ({ icon, text }) => (
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
      <Icon name={icon} size={10} color="#3b82f6" />
    </div>
    <span className="text-slate-300 text-xs font-500">{text}</span>
  </div>
);

/* ================================================================
   PORTAL CARD COMPONENT
================================================================ */
const PortalCard = ({ title, subtitle, description, features, to, buttonText, icon, gradient, badge }) => (
  <Link to={to}
    className="portal-card relative group flex flex-col bg-navy-800/60 backdrop-blur-xl border border-white/[.07] rounded-2xl overflow-hidden cursor-pointer no-underline">

    {/* Top gradient bar */}
    <div className={`h-1.5 w-full ${gradient}`} />

    {/* Content */}
    <div className="flex flex-col flex-1 p-5">

      {/* Header - Inline Layout */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <Icon name={icon} size={20} color="#3b82f6" />
          </div>
          <div>
            <h2 className="text-white text-base font-800 tracking-tight leading-tight">{title}</h2>
            <p className="text-accent text-[11px] font-600 mt-0.5">{subtitle}</p>
          </div>
        </div>
        {badge && (
          <span className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-700 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            {badge}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1">{description}</p>

      {/* Features - 2 Column Grid */}
      <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-5">
        {features.map((f, i) => <Feature key={i} icon={f.icon} text={f.text} />)}
      </div>

      {/* CTA Button */}
      <div className={`btn-glow flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-700 text-white transition-all ${gradient} group-hover:opacity-90`}>
        {buttonText}
        <Icon name="chevR" size={16} color="white" />
      </div>
    </div>
  </Link>
);

export default function LandingPage() {
  return (
    <div className="hero-bg h-screen overflow-hidden flex flex-col">

      {/* Grid pattern overlay */}
      <div className="grid-pattern fixed inset-0 pointer-events-none" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-8 py-4 fade-in">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center">
            <Icon name="users" size={16} color="#3b82f6" />
          </div>
          <div>
            <span className="text-white font-800 text-sm tracking-tight">CastingHub</span>
            <span className="ml-2 text-[9px] font-700 text-accent/80 bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded-full">ENTERPRISE</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 text-slate-400 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            System Online
          </span>
          <div className="w-7 h-7 rounded-full bg-navy-700 border border-white/10 flex items-center justify-center">
            <Icon name="user" size={14} color="#94a3b8" />
          </div>
        </div>
      </header>

      {/* Hero section - Shifted up with -mt-16 */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 -mt-16">

        {/* Logo mark */}
        <div className="fade-in fade-in-d1 float-anim mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-indigo-500/20 border border-white/10 flex items-center justify-center shadow-lg shadow-accent/10">
            <Icon name="users" size={26} color="#3b82f6" />
          </div>
        </div>

        {/* Heading - Forced to single line */}
        <h1 className="fade-in fade-in-d2 text-center text-white text-2xl sm:text-4xl font-900 tracking-tight leading-tight max-w-4xl sm:whitespace-nowrap">
          Welcome to your professional <span className="bg-gradient-to-r from-accent to-indigo-400 bg-clip-text text-transparent">casting network</span>
        </h1>

        <p className="fade-in fade-in-d2 text-slate-400 text-sm sm:text-base text-center mt-3 max-w-lg leading-relaxed">
          Manage talent, discover opportunities, and streamline your casting workflow — all in one enterprise platform.
        </p>

        {/* Stats row */}
        <div className="fade-in fade-in-d3 flex flex-wrap items-center justify-center gap-3 mt-6">
          <StatPill icon="db" label="IndexedDB Powered" value="20K+" />
          <StatPill icon="zap" label="Sub-ms Search" value="<1ms" />
          <StatPill icon="shield" label="Persistent Data" value="Local" />
        </div>

        {/* Portal card */}
        <div className="fade-in fade-in-d4 mt-8 w-full max-w-xl mx-auto">
          <PortalCard
            title="Talent Workspace"
            subtitle="My Cabinet"
            description="Manage your profile, upload headshots and reels, track auditions, and stay on top of casting calls."
            icon="user"
            gradient="bg-gradient-to-r from-indigo-500 to-purple-600"
            to="/login"
            buttonText="Go to My Cabinet"
            badge="Online"
            features={[
              { icon: 'user', text: 'Profile editor with live preview' },
              { icon: 'camera', text: 'Media gallery with pinning' },
              { icon: 'star', text: 'Audition tracking & status' },
              { icon: 'upload', text: 'PDF resume export' },
            ]}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex items-center justify-center py-4">
        <p className="text-slate-600 text-[11px]">
          CastingHub Enterprise &copy; 2026 &mdash; Built with React 18, Dexie.js, and IndexedDB
        </p>
      </footer>
    </div>
  );
}