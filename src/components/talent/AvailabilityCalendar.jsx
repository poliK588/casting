import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../shared/Icon';
import { useAuth } from '../../context/AuthContext';
import { getAvailability, calculateOverallStatus } from '../../services/talentService';
import AvailabilityModal from '../modals/AvailabilityModal';

export default function AvailabilityCalendar({ onStatusChange }) {
  const { profile } = useAuth();
  const talentId = profile?.id;

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-indexed
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const daysRow = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // ── Fetch availability from Supabase ──
  const loadAvailability = useCallback(async () => {
    if (!talentId) return;
    const data = await getAvailability(talentId, year, month);
    const map = {};
    (data || []).forEach(row => { map[row.date] = row.status; });
    setAvailabilityMap(map);

    // Notify parent of overall status
    if (onStatusChange) {
      const overall = calculateOverallStatus(map, year, month);
      onStatusChange(overall);
    }
  }, [talentId, year, month, onStatusChange]);

  useEffect(() => { loadAvailability(); }, [loadAvailability]);

  // ── Generate calendar grid ──
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=Sun

  const grid = [];
  // Leading empties
  for (let i = 0; i < firstDayOfWeek; i++) grid.push({ n: '', t: 'empty' });
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const status = availabilityMap[dateStr] || 'free';
    const isToday = d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
    grid.push({ n: d, t: status, today: isToday });
  }
  // Trailing empties to fill last row
  while (grid.length % 7 !== 0) grid.push({ n: '', t: 'empty' });

  // ── Month navigation ──
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' });

  // ── Callback when modal saves ──
  const handleModalSave = (updatedMap) => {
    setAvailabilityMap(updatedMap);
    setIsModalOpen(false);
    if (onStatusChange) {
      const overall = calculateOverallStatus(updatedMap, year, month);
      onStatusChange(overall);
    }
  };

  return (
    <>
      <div className="bg-navy-900/40 border border-white/10 rounded-2xl px-2 py-1">
        {/* Header with nav arrows */}
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/5 transition-colors text-white/30 hover:text-white/60 cursor-pointer">
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-white/50 tracking-wide uppercase">
              <Icon name="calendar" size={10} color="#818cf8" />
              {monthName} {year}
            </span>
            <button onClick={nextMonth} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/5 transition-colors text-white/30 hover:text-white/60 cursor-pointer">
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-[10px] font-medium text-indigo-400/80 tracking-wide cursor-pointer hover:text-indigo-300 transition-colors bg-transparent border-0"
          >
            Set Availability &rarr;
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-0 text-[9px] text-center text-white/30 font-medium">
          {daysRow.map((d, i) => <span key={i} className="h-[14px] flex items-center justify-center">{d}</span>)}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {grid.map((d, i) => {
            let cls = "h-[26px] w-[26px] mx-auto rounded-[4px] flex items-center justify-center text-[9px] font-semibold ";
            if (d.t === 'empty') cls += "bg-transparent text-white/10";
            else if (d.t === 'free') cls += "bg-emerald-500/15 text-emerald-300";
            else if (d.t === 'busy') cls += "bg-red-500/15 text-red-300";
            else if (d.t === 'partial') cls += "bg-amber-500/15 text-amber-300";
            if (d.today) cls += " ring-[1.5px] ring-indigo-400 ring-offset-1 ring-offset-transparent";
            return <div key={i} className={cls}>{d.n}</div>;
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex items-center gap-1 text-[8px] text-white/30">
            <div className="w-2 h-2 rounded-sm bg-emerald-500/15" /> Free
          </div>
          <div className="flex items-center gap-1 text-[8px] text-white/30">
            <div className="w-2 h-2 rounded-sm bg-amber-500/15" /> Partial
          </div>
          <div className="flex items-center gap-1 text-[8px] text-white/30">
            <div className="w-2 h-2 rounded-sm bg-red-500/15" /> Busy
          </div>
        </div>
      </div>

      {/* Availability editing modal */}
      {isModalOpen && (
        <AvailabilityModal
          talentId={talentId}
          year={year}
          month={month}
          initialMap={availabilityMap}
          onSave={handleModalSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
