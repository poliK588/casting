import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../shared/Icon';
import StatusBadge from '../shared/StatusBadge';

/* ─── Instagram SVG Icon ─── */
const InstagramIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

export default function ProfileSummaryCard({ user, editLink, availabilityStatus }) {
  if (!user) return null;

  // ── Data Formatting ──
  const heightStr = (user.height_ft != null && user.height_in != null)
    ? `${user.height_ft}'${user.height_in}"`
    : '--';
  const weightStr = user.weight_lbs ? `${user.weight_lbs}` : '--';
  const unionBadge = user.union_status || 'Non-union';
  const statusLabel = user.status === 'available' ? 'Available' : (user.status || 'Available');
  const instagramHandle = user.social_links?.instagram || null;
  const heroImage = user.heroImg || user.image_url;

  // ── Tag arrays ──
  const skillTags = (user.skills && user.skills.length > 0) ? user.skills : [];
  const langTags = (user.languages && user.languages.length > 0) ? user.languages : [];

  return (
    <div className="relative bg-navy-900/40 border border-white/10 rounded-2xl overflow-visible flex flex-col">
      
      {/* ══════ A. HERO HEADER ══════ */}
      <div 
        className="h-[200px] w-full rounded-t-2xl relative overflow-hidden bg-cover bg-center"
        style={heroImage ? { backgroundImage: `url(${heroImage})` } : {}}
      >
        {!heroImage && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <svg className="w-12 h-12 text-slate-500/30" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
          </div>
        )}
        {/* Bottom gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-navy-900/80" />
        {/* Top gradient overlay — badge readability scrim */}
        <div className="absolute inset-x-0 top-0 h-[35%] z-[5]" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)' }} />

        {/* Top badge row */}
        <div className="absolute top-2.5 left-2 right-2 z-10 flex items-center justify-between">
          <StatusBadge status={availabilityStatus || user.status || 'available'} type="availability" />
          <StatusBadge status={unionBadge} type="union" />
        </div>
      </div>

      {/* ══════ B. IDENTITY GROUP (Height Saver) ══════ */}
      <div className="flex flex-row items-center gap-4 px-5 -mt-12 relative z-20">
        
        {/* Avatar Container */}
        <div className="relative flex-shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar} alt={user.name}
              className="w-[76px] h-[76px] rounded-full object-cover object-top border-2 border-navy-900 shadow-2xl"
            />
          ) : (
            <div className="w-[76px] h-[76px] rounded-full border-2 border-navy-900 shadow-2xl bg-slate-700 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            </div>
          )}
          {/* Green Status Dot (Left Side) */}
          <span className="absolute bottom-1 left-1 w-3.5 h-3.5 bg-green-500 border-2 border-navy-900 rounded-full" />
        </div>

        {/* Name / Location / Instagram */}
        <div className="flex-1 flex flex-row items-center justify-between min-w-0 mt-[16px]">
          <div>
            <div className="text-lg font-bold text-white leading-tight truncate flex items-center gap-1.5">
              <StatusBadge status={user.verification_status} type="verification" />
              {user.name}
            </div>
            <div className="text-[10px] text-white/40 font-normal mt-0.5 truncate">
              {user.age || '--'} yrs &bull; {user.location || 'Location not set'}
            </div>
          </div>
          {instagramHandle && (
            <a
              href={instagramHandle.startsWith('http') ? instagramHandle : `https://instagram.com/${instagramHandle.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white transition-colors"
            >
              <InstagramIcon size={14} />
            </a>
          )}
        </div>
      </div>

      {/* ══════ C. CONTENT & STATS AREA ══════ */}
      <div className="px-5 pb-2 flex flex-col flex-1">

        {/* ── Data Grid: AGE | HEIGHT | WEIGHT ── */}
        <div className="grid grid-cols-3 gap-px bg-white/5 border border-white/10 rounded-lg my-1 py-0.5 text-center">
          <div>
            <div className="text-[7px] uppercase tracking-widest text-white/20 mb-0.5">AGE</div>
            <div className="text-xs font-bold text-white">{user.age || '--'}</div>
          </div>
          <div>
            <div className="text-[7px] uppercase tracking-widest text-white/20 mb-0.5">HEIGHT</div>
            <div className="text-xs font-bold text-white">{heightStr}</div>
          </div>
          <div>
            <div className="text-[7px] uppercase tracking-widest text-white/20 mb-0.5">WEIGHT</div>
            <div className="text-xs font-bold text-white">{weightStr}{weightStr !== '--' && ' lbs'}</div>
          </div>
        </div>

        {/* ── Skills & Languages ── */}
        <div className="flex flex-col gap-2">
          {skillTags.length > 0 && (
            <div>
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mb-1 block">SKILLS</span>
              <div className="flex flex-wrap gap-1.5">
                {skillTags.map((s, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] font-normal text-white/50">{s}</span>
                ))}
              </div>
            </div>
          )}

          {langTags.length > 0 && (
            <div>
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mb-1 block">LANGUAGES</span>
              <div className="flex flex-wrap gap-1.5">
                {langTags.map((l, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] font-normal text-white/50">{l}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Edit Profile Button ── */}
        <div className="mt-auto pt-1">
          {editLink ? (
            <Link
              to={editLink}
              className="w-full h-7 border border-white/10 rounded-lg mt-1.5 text-[10px] font-medium tracking-[0.2em] flex items-center justify-center text-white/80 transition-all hover:bg-white/5 hover:text-white no-underline"
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="mr-2 opacity-80">
                <path strokeLinecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Edit Profile
            </Link>
          ) : (
            <button className="w-full h-7 border border-white/10 rounded-lg mt-1.5 text-[10px] font-medium tracking-[0.2em] flex items-center justify-center text-white/80 transition-all hover:bg-white/5 hover:text-white">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="mr-2 opacity-80">
                <path strokeLinecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Edit Profile
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
