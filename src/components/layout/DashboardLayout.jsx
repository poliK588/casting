import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import TalentSidebar from './TalentSidebar';
import TalentHeader from './TalentHeader';
import ProfileSummaryCard from '../talent/ProfileSummaryCard';
import AvailabilityCalendar from '../talent/AvailabilityCalendar';
import FilterPanel from '../admin/FilterPanel';
import { SearchProvider } from '../../context/SearchContext';
import { useAuth } from '../../context/AuthContext';
import { AppContext } from '../../context/AppContext';
import { supabase } from '../../services/supabaseClient';
import { normalizeProfile } from '../../utils/profileAdapter';

export default function DashboardLayout({ type }) {
  const isAdmin = type === 'admin';
  const isTalent = type === 'talent';
  const { user: authUser } = useAuth();
  const { activeNav } = useContext(AppContext);

  // ── State ──
  const [profile, setProfile] = useState(null);
  const [privateInfo, setPrivateInfo] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [availabilityStatus, setAvailabilityStatus] = useState('available');

  // ── Fetch logic (uses authUser from context — no redundant auth check) ──
  const loadProfile = useCallback(async () => {
    if (!isTalent || !authUser?.id) return;
    try {
      const userId = authUser.id;

      // ── Request A (Public): Profile + relational joins ──
      // ── Request B (Private): Isolated — uses maybeSingle() to avoid 406 on missing rows ──
      let [publicRes, privateRes] = await Promise.all([
        supabase
          .from('profiles')
          .select(`*,
            user_skills(skill_id, skills(name)),
            user_languages(language_id, languages(name)),
            user_ethnicities(ethnicity_id, ethnicities(name))`)
          .eq('auth_id', userId)
          .maybeSingle(),
        supabase
          .from('profile_private_info')
          .select('*')
          .eq('auth_id', userId)
          .maybeSingle()
      ]);

      // ── Auto-Upsert Rule: If profile is missing, initialize it immediately ──
      if (!publicRes.data) {
        console.warn('[DATA_INTEGRITY] Profile not found. Auto-initializing with auth_id.');
        const { data: newProfile, error: upsertErr } = await supabase
          .from('profiles')
          .upsert({ auth_id: userId, first_name: '', last_name: '' }, { onConflict: 'auth_id' })
          .select()
          .maybeSingle();

        if (upsertErr) {
          console.error('[DATA_INTEGRITY_FAIL] Auto-upsert failed:', upsertErr);
        } else {
          publicRes = { data: newProfile, error: null };
        }
      }

      // ── Process public data via zero-crash adapter ──
      if (publicRes.error) {
        console.error('[DATA_INTEGRITY_FAIL] Profile fetch error:', publicRes.error);
      }
      
      const safeProfile = normalizeProfile(publicRes.data);
      setProfile(safeProfile);

      // ── Process private data (null when no row exists — not an error) ──
      if (privateRes.error) {
        console.error('[DATA_INTEGRITY_FAIL] Private info fetch error:', privateRes.error);
      }
      setPrivateInfo(privateRes.data || null);

    } catch (err) {
      console.error('[DATA_INTEGRITY_FAIL] Error loading profile data:', err);
    } finally {
      setIsProfileLoading(false);
    }
  }, [isTalent, authUser?.id]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // ── Callback for child routes to trigger re-fetch after save ──
  const refreshProfile = useCallback(() => {
    loadProfile();
  }, [loadProfile]);

  // ── Build user object for HUD (Zone B) directly from normalized profile ──
  const user = isTalent ? profile : null;

  // ── Admin: 3-level layout ──
  if (isAdmin) {
    return (
      <SearchProvider>
      <div className="flex h-screen w-full overflow-hidden relative bg-slate-100 text-slate-900">

        {/* LEVEL 1: OVERLAY HOVER RAIL */}
        <nav className="group absolute left-0 top-0 z-50 flex h-full w-[72px] flex-col border-r border-white/10 bg-navy-900 transition-all duration-300 hover:w-[240px]">
          <AdminSidebar />
        </nav>

        {/* LEVEL 2: PUSH DRAWER */}
        <aside className={`h-full transition-all duration-300 overflow-hidden flex-shrink-0 ml-[72px] ${
          activeNav ? 'w-[320px] border-r border-slate-200' : 'w-0'
        }`}>
          <div className="w-full h-full min-w-[320px]">
            {activeNav && <FilterPanel />}
          </div>
        </aside>

        {/* LEVEL 3: MAIN GRID */}
        <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
          <AdminHeader />
          <div className="flex-1 min-h-0 overflow-y-auto">
            <Outlet context={{ profile, privateInfo, refreshProfile }} />
          </div>
        </main>

      </div>
      </SearchProvider>
    );
  }

  // ── Talent: Original layout (untouched) ──
  return (
    <div className="flex h-screen w-full overflow-hidden hero-bg text-slate-300">
      <div className="grid-pattern fixed inset-0 pointer-events-none z-0" />

      {/* ── Zone A: Global Sidebar (68px icon strip) ── */}
      <TalentSidebar />

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <TalentHeader />

        {/* Main content area */}
        <main className="flex-1 min-h-0 flex overflow-hidden w-full relative z-0">

          {/* ── Zone B: Persistent HUD (Talent only, 300px) ── */}
          <aside className="w-[300px] flex-shrink-0 overflow-y-auto px-4 py-3 flex flex-col gap-1.5 scroll-area">
            {isProfileLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-6 h-6 rounded-full border-[3px] border-white border-t-transparent"></div>
              </div>
            ) : (
              <>
                <ProfileSummaryCard user={user} editLink="/talent/profile" availabilityStatus={availabilityStatus} />
                <AvailabilityCalendar onStatusChange={setAvailabilityStatus} />
              </>
            )}
          </aside>

          {/* ── Zone C: Flexible Content Area (single scroll owner) ── */}
          <div className="flex-1 min-h-0 h-full overflow-y-auto scroll-area">
            <Outlet context={{ profile, privateInfo, refreshProfile }} />
          </div>

        </main>
      </div>
    </div>
  );
}
