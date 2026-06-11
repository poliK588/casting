import React, { useState, useEffect, useRef, useCallback } from 'react';
import { saveAvailability, getAvailability } from '../../services/talentService';

const STATUS_CYCLE = ['free', 'busy', 'partial'];

export default function AvailabilityModal({ talentId, year, month, initialMap, onSave, onClose }) {
  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month);
  const [localMap, setLocalMap] = useState({ ...initialMap });
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStatus, setDragStatus] = useState(null);
  const gridRef = useRef(null);

  const daysRow = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date();

  // ── Load data when navigating months ──
  const loadMonth = useCallback(async () => {
    if (!talentId) return;
    // If same month as parent's initial, use initialMap
    if (viewYear === year && viewMonth === month) {
      setLocalMap({ ...initialMap });
      return;
    }
    const data = await getAvailability(talentId, viewYear, viewMonth);
    const map = {};
    (data || []).forEach(row => { map[row.date] = row.status; });
    setLocalMap(prev => {
      // Keep other months' changes, merge this month's data
      const filtered = Object.fromEntries(
        Object.entries(prev).filter(([key]) => {
          const [y, m] = key.split('-');
          return !(parseInt(y) === viewYear && parseInt(m) === viewMonth);
        })
      );
      return { ...filtered, ...map };
    });
  }, [talentId, viewYear, viewMonth, year, month, initialMap]);

  useEffect(() => { loadMonth(); }, [loadMonth]);

  // ── Calendar generation ──
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();
  const monthName = new Date(viewYear, viewMonth - 1).toLocaleString('en-US', { month: 'long' });

  const grid = [];
  for (let i = 0; i < firstDayOfWeek; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);

  const getDateStr = (day) => `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const getStatus = (day) => localMap[getDateStr(day)] || 'free';

  // ── Click: cycle status ──
  const cycleDay = (day) => {
    const dateStr = getDateStr(day);
    const current = localMap[dateStr] || 'free';
    const nextIdx = (STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length;
    const nextStatus = STATUS_CYCLE[nextIdx];
    setLocalMap(prev => ({ ...prev, [dateStr]: nextStatus }));
  };

  // ── Drag: set all dragged days to same status ──
  const handleMouseDown = (day) => {
    if (!day) return;
    const dateStr = getDateStr(day);
    const current = localMap[dateStr] || 'free';
    const nextIdx = (STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length;
    const nextStatus = STATUS_CYCLE[nextIdx];
    setDragStatus(nextStatus);
    setIsDragging(true);
    setLocalMap(prev => ({ ...prev, [dateStr]: nextStatus }));
  };

  const handleMouseEnter = (day) => {
    if (!isDragging || !day || dragStatus === null) return;
    const dateStr = getDateStr(day);
    setLocalMap(prev => ({ ...prev, [dateStr]: dragStatus }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStatus(null);
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // ── Lock body scroll ──
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ── Close on Escape ──
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // ── Month nav ──
  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // ── Save ──
  const handleSave = async () => {
    if (!talentId) return;
    setIsSaving(true);
    try {
      await saveAvailability(talentId, localMap);
      onSave(localMap);
    } catch (err) {
      console.error('Failed to save availability:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Day cell color logic ──
  const getCellClasses = (day) => {
    if (!day) return 'bg-transparent';
    const status = getStatus(day);
    const isToday = day === today.getDate() && viewMonth === today.getMonth() + 1 && viewYear === today.getFullYear();
    let cls = 'rounded-lg flex items-center justify-center text-sm font-semibold cursor-pointer select-none transition-colors duration-100 ';
    if (status === 'free') cls += 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25';
    else if (status === 'busy') cls += 'bg-red-500/15 text-red-300 hover:bg-red-500/25';
    else if (status === 'partial') cls += 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25';
    if (isToday) cls += ' ring-2 ring-indigo-400 ring-offset-1 ring-offset-transparent';
    return cls;
  };

  return (
    <div
      className="fixed inset-0 z-[200] modal-backdrop flex items-center justify-center p-4"
      style={{
        background: 'rgba(15, 23, 42, 0.25)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel modal-panel w-full max-w-xl flex flex-col overflow-hidden"
        style={{ borderRadius: '1.25rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Set Availability</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-navy-400)' }}>Click or drag days to cycle: Free → Busy → Partial</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer bg-white/5 hover:bg-white/10"
          >
            <svg width="18" height="18" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" style={{ stroke: 'var(--color-navy-100)' }}>
              <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* ── Month navigation ── */}
        <div className="flex items-center justify-center gap-4 px-6 pb-3">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white cursor-pointer">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <span className="text-sm font-bold text-white tracking-wide min-w-[140px] text-center">
            {monthName} {viewYear}
          </span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white cursor-pointer">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>

        {/* ── Calendar grid ── */}
        <div className="px-6 pb-2" ref={gridRef}>
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {daysRow.map((d, i) => (
              <div key={i} className="h-8 flex items-center justify-center text-[10px] font-bold text-white/30 uppercase tracking-wider">{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {grid.map((day, i) => (
              <div
                key={i}
                className={`h-[44px] ${getCellClasses(day)}`}
                onMouseDown={() => day && handleMouseDown(day)}
                onMouseEnter={() => day && handleMouseEnter(day)}
              >
                {day || ''}
              </div>
            ))}
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="flex items-center justify-center gap-5 px-6 py-3">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/40">
            <div className="w-3 h-3 rounded bg-emerald-500/15" /> Free
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/40">
            <div className="w-3 h-3 rounded bg-amber-500/15" /> Partial
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/40">
            <div className="w-3 h-3 rounded bg-red-500/15" /> Busy
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3 px-6 pb-5 pt-1 border-t border-white/7">
          <button
            onClick={onClose}
            className="h-9 px-5 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary h-9 px-6 !rounded-xl text-xs font-bold flex items-center gap-2"
          >
            {isSaving ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
            )}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
