import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { useSearch } from '../../context/SearchContext';
import { SkillTag } from '../shared/UIHelpers';
import TalentCard from './TalentCard';
import Icon from '../shared/Icon';

function TalentListRow({ talent: t }) {
  const { shortlist, toggleShortlist, setTalentModal } = useContext(AppContext);
  const inShortlist = shortlist.has(t.id);
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className="talent-card bg-white rounded-xl border border-slate-100 shadow-sm hover:border-slate-200 flex items-center gap-4 px-4 py-3">
      <img
        src={imgErr ? `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=e8eaff&color=1a237e&size=120&bold=true` : t.img}
        alt={t.name}
        loading="lazy"
        onError={() => setImgErr(true)}
        className="w-12 h-12 rounded-xl object-cover object-top flex-shrink-0"
      />
      <div className="flex-1 min-w-0 grid items-center gap-4" style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr' }}>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{t.name}</p>
          <p className="text-[11px] text-slate-400">{t.age} yrs &bull; {t.city || '—'}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {(t.skillNames || []).slice(0, 3).map(s => <SkillTag key={s} skill={s} />)}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">{t.union_status || '—'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-400">{t.gender || '—'}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={() => setTalentModal?.(t)}
          className="h-7 px-2.5 flex items-center gap-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 hover:text-navy-900 transition-colors">
          <Icon name="eye" size={13} color="currentColor" /> View
        </button>
        <button onClick={() => toggleShortlist(t.id)}
          className={`h-7 px-2 border rounded-lg transition-colors ${inShortlist ? 'bg-accent text-white border-accent' : 'border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-accent'}`}>
          <Icon name="starFill" size={13} color="currentColor" />
        </button>
      </div>
    </div>
  );
}

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm animate-pulse">
      <div className="bg-slate-100" style={{ aspectRatio: '3/4' }} />
      <div className="px-3 py-2.5 space-y-2">
        <div className="h-3.5 bg-slate-100 rounded w-3/4" />
        <div className="h-2.5 bg-slate-100 rounded w-1/2" />
        <div className="flex gap-1 pt-1">
          <div className="h-4 bg-slate-100 rounded-full w-12" />
          <div className="h-4 bg-slate-100 rounded-full w-10" />
        </div>
      </div>
    </div>
  );
}

// Loading overlay for flicker prevention (#12)
function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-start justify-center pt-24 pointer-events-none">
      <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-2.5">
        <svg className="animate-spin h-4 w-4 text-navy-700" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-xs font-semibold text-slate-600">Searching…</span>
      </div>
    </div>
  );
}

// Load More button
function LoadMoreBtn({ onClick, isAppending }) {
  return (
    <div className="flex justify-center py-4 pb-8">
      <button
        onClick={onClick}
        disabled={isAppending}
        className="flex items-center gap-2 h-9 px-6 bg-navy-900 hover:bg-navy-800 rounded-lg text-xs text-white font-bold transition-colors disabled:opacity-50"
      >
        {isAppending ? (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : null}
        Load More
      </button>
    </div>
  );
}

export default function TalentGrid() {
  const { results, loading, isAppending, isSearchEngineReady, error, hasMore, loadMore, clearFilters } = useSearch();
  const { viewMode } = useContext(AppContext);

  // ── HARD RELIABILITY GATE ──
  // Full skeleton until ALL dictionaries are loaded.
  if (!isSearchEngineReady) {
    return (
      <div className="p-5 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))' }}>
        {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  // First load: no results yet, loading
  if (loading && results.length === 0) {
    return (
      <div className="p-5 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))' }}>
        {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  // Error state with no results
  if (error && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <Icon name="info" size={28} color="#ef4444" />
        </div>
        <p className="text-sm font-bold text-slate-500">Something went wrong</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">{error}</p>
        <button
          onClick={clearFilters}
          className="mt-4 text-xs text-navy-700 font-semibold hover:underline transition-colors"
        >
          Reset filters
        </button>
      </div>
    );
  }

  // Empty state (#10): clean zero-results with quick actions
  if (!loading && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Icon name="search" size={28} color="#cbd5e1" />
        </div>
        <p className="text-sm font-bold text-slate-500">No results found</p>
        <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or clearing filters</p>
        <button
          onClick={clearFilters}
          className="mt-4 flex items-center gap-1.5 h-8 px-4 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold rounded-lg transition-colors"
        >
          <Icon name="close" size={12} color="white" />
          Clear all filters
        </button>
      </div>
    );
  }

  // ── RESULTS RENDERING ──
  // Flicker prevention (#11, #12): previous results remain visible.
  // Loading overlay appears on top without clearing them.

  // List view
  if (viewMode === 'list') {
    return (
      <div className="relative">
        {loading && results.length > 0 && <LoadingOverlay />}
        <div className="flex flex-col gap-2 p-5">
          {results.map(t => <TalentListRow key={t.id} talent={t} />)}
          {hasMore && <LoadMoreBtn onClick={loadMore} isAppending={isAppending} />}
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="relative">
      {loading && results.length > 0 && <LoadingOverlay />}
      <div className="p-5 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))' }}>
        {results.map(t => <TalentCard key={t.id} talent={t} />)}
      </div>
      {hasMore && <LoadMoreBtn onClick={loadMore} isAppending={isAppending} />}
    </div>
  );
}
