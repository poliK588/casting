import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import MediaHighlights from '../components/talent/MediaHighlights';
import ProfileCompletionBanner from '../components/talent/ProfileCompletionBanner';
import { supabase } from '../services/supabaseClient';

export default function TalentDashboard() {
  const { profile } = useOutletContext();
  const [mediaCount, setMediaCount] = useState(0);
  const [submissionsCount, setSubmissionsCount] = useState(0);
  const [invitationsCount, setInvitationsCount] = useState(0);
  const [daysAvailable, setDaysAvailable] = useState(0);

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      if (!profile?.id) return;

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const firstDay = `${year}-${month}-01`;
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      const lastDayStr = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

      const [mediaRes, subRes, invRes, daysRes] = await Promise.all([
        supabase
          .from('media')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', profile.id),
        supabase
          .from('auditions')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', profile.id)
          .eq('type', 'submission')
          .eq('status', 'active'),
        supabase
          .from('auditions')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', profile.id)
          .eq('type', 'invitation')
          .eq('status', 'active'),
        supabase
          .from('talent_availability')
          .select('*', { count: 'exact', head: true })
          .eq('talent_id', profile.id)
          .eq('status', 'busy')
          .gte('date', firstDay)
          .lte('date', lastDayStr)
      ]);

      setMediaCount(mediaRes.count || 0);
      setSubmissionsCount(subRes.count || 0);
      setInvitationsCount(invRes.count || 0);

      const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
      const busyDays = daysRes.count || 0;
      setDaysAvailable(daysInMonth - busyDays);
    };

    fetchDashboardMetrics();
  }, [profile?.id]);

  const displayName = profile?.first_name || 'Talent';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="px-6 py-5 flex flex-col gap-5">

      {/* ── Page Title ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">My Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">Welcome, {displayName} — here's your activity overview for today.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" /></svg>
          {dateStr}
        </div>
      </div>

      {/* ── Profile Completion Banner ── */}
      {profile && <ProfileCompletionBanner user={profile} mediaCount={mediaCount} />}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-5 gap-3.5">
        {/* Active Submissions */}
        <div className="kpi-card lift glass-panel !rounded-[14px] p-4 pb-[18px] flex flex-col gap-2.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 to-purple-500" />
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-white/10 text-slate-300">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">—</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold leading-[1] tracking-tight text-white">{submissionsCount}</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Active Submissions</div>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-auto">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${Math.min(submissionsCount * 10, 100)}%` }} />
          </div>
        </div>

        {/* New Invitations */}
        <div className="kpi-card lift glass-panel !rounded-[14px] p-4 pb-[18px] flex flex-col gap-2.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 to-emerald-400" />
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-emerald-500/15 text-emerald-400">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">—</span>
          </div>
          <div>
            <div className="text-3xl font-bold leading-[1] tracking-[0.01em] text-emerald-400">{invitationsCount}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">New Invitations</div>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-auto">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${Math.min(invitationsCount * 25, 100)}%` }} />
          </div>
        </div>

        {/* Days Available */}
        <div className="kpi-card lift glass-panel !rounded-[14px] p-4 pb-[18px] flex flex-col gap-2.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 to-purple-400" />
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-purple-500/15 text-purple-400">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" /></svg>
            </div>
            <span className="text-xs font-semibold text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-full">This Month</span>
          </div>
          <div>
            <div className="text-3xl font-bold leading-[1] tracking-[0.01em] text-purple-400">{daysAvailable}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Days Available</div>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-auto">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400" style={{ width: `${Math.min((daysAvailable / 31) * 100, 100)}%` }} />
          </div>
        </div>

        {/* Unread Messages */}
        <div className="kpi-card lift glass-panel !rounded-[14px] p-4 pb-[18px] flex flex-col gap-2.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 to-amber-400" />
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-amber-500/15 text-amber-400">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">—</span>
          </div>
          <div>
            <div className="text-3xl font-bold leading-[1] tracking-[0.01em] text-amber-400">0</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Unread Messages</div>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-auto"><div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400" style={{ width: '0%' }} /></div>
        </div>

        {/* Audition Score */}
        <div className="kpi-card lift glass-panel !rounded-[14px] p-4 pb-[18px] flex flex-col gap-2.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 to-indigo-400" />
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-indigo-500/15 text-indigo-400">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            </div>
            <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-full">—</span>
          </div>
          <div>
            <div className="text-3xl font-bold leading-[1] tracking-[0.01em] text-indigo-400">{profile?.rating || '—'}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Audition Score</div>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-auto"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400" style={{ width: '0%' }} /></div>
        </div>
      </div>

      {/* ── Main Modules (full width, no left column) ── */}
      <div className="flex flex-col gap-4 mt-1">

        {/* Current Auditions */}
        <div className="glass-panel !rounded-[14px] p-[18px] lift">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Current Auditions
              <span className="bg-white/10 text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">0</span>
            </span>
            <span className="text-xs font-semibold text-indigo-400 cursor-pointer hover:underline flex items-center gap-1">View All →</span>
          </div>
          <div className="text-center py-10 text-slate-400">
            <svg className="w-8 h-8 text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="text-xs font-semibold">0 active auditions.</p>
            <p className="text-xs mt-1 text-slate-500">Submit to castings to see them here.</p>
          </div>
        </div>

        {/* Media + Messages row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Media Highlights */}
          <MediaHighlights />

          {/* Recent Messages */}
          <div className="glass-panel !rounded-[14px] p-[18px] lift">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                Recent Messages
                <span className="bg-white/10 text-slate-400 text-xs font-bold px-2 py-0.5 rounded-full">0</span>
              </span>
              <span className="text-xs font-semibold text-indigo-400 cursor-pointer hover:underline flex items-center gap-1">Inbox →</span>
            </div>
            <div className="text-center py-8 text-slate-400">
              <svg className="w-7 h-7 text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              <p className="text-xs font-semibold">No new messages yet.</p>
            </div>
          </div>
        </div>

        {/* Open Casting Calls */}
        <div className="glass-panel !rounded-[14px] p-[18px] lift">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              Open Casting Calls — Matched for You
              <span className="bg-white/10 text-slate-400 text-xs font-bold px-2 py-0.5 rounded-full">0</span>
            </span>
            <span className="text-xs font-semibold text-indigo-400 cursor-pointer hover:underline flex items-center gap-1">Browse All →</span>
          </div>
          <div className="text-center py-10 text-slate-400">
            <svg className="w-8 h-8 text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            <p className="text-xs font-semibold">No matching casting calls yet.</p>
            <p className="text-xs mt-1 text-slate-500">Complete your profile to get matched.</p>
          </div>
        </div>

      </div>

      <div className="h-2"></div>
    </div>
  );
}
