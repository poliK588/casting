import React from 'react';

export default function StatusBadge({ status, type = 'availability' }) {
  if (type === 'availability') {
    const s = (status || 'available').toLowerCase();
    const isAvailable = s === 'available' || s === 'free';
    const isPartial = s === 'partial';
    const dotColor = isAvailable ? 'bg-emerald-500' : isPartial ? 'bg-amber-500' : 'bg-red-500';
    const label = isAvailable ? 'Available' : isPartial ? 'Partial' : 'Busy';

    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-white">
        <span className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`} />
        {label}
      </span>
    );
  }

  if (type === 'union') {
    const u = (status || 'Non-Union').toLowerCase();
    const isSag = u.includes('sag');
    const isEquity = u.includes('equity');
    const isActra = u.includes('actra') || u.includes('actor');
    const isHighTier = isSag || isEquity;

    const icon = isHighTier ? (
      <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    ) : isActra ? (
      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
    ) : (
      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M20 12H4"/></svg>
    );

    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase text-white">
        {icon}
        {status || 'Non-Union'}
      </span>
    );
  }

  if (type === 'verification') {
    if (!status || status === 'unverified') return null;

    const isPending = status === 'pending';
    const isVerified = status === 'verified';

    if (isVerified) return (
      <span title="Verified Talent" className="inline-flex items-center">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="#3b82f6" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
      </span>
    );

    if (isPending) return (
      <span title="Verification pending" className="inline-flex items-center">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="#f59e0b" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </span>
    );
  }

  return null;
}
