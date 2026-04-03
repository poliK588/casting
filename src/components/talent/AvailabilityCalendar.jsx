import React from 'react';
import Icon from '../shared/Icon';

export default function AvailabilityCalendar() {
  const daysRow = ['S','M','T','W','T','F','S'];
  const grid = [
    {n:'', t:'empty'},{n:'', t:'empty'},{n:'', t:'empty'},
    {n:1, t:'free'},{n:2, t:'free'},{n:3, t:'free'},{n:4, t:'free'},
    {n:5, t:'free'},{n:6, t:'free'},{n:7, t:'free'},
    {n:8, t:'busy'},{n:9, t:'busy'},{n:10, t:'busy'},{n:11, t:'busy'},
    {n:12, t:'busy'},{n:13, t:'busy'},{n:14, t:'partial'},
    {n:15, t:'free'},{n:16, t:'free'},{n:17, t:'free today'},
    {n:18, t:'free'},{n:19, t:'free'},{n:20, t:'free'},{n:21, t:'free'},
    {n:22, t:'free'},{n:23, t:'free'},{n:24, t:'free'},
    {n:25, t:'free'},{n:26, t:'free'},{n:27, t:'free'},{n:28, t:'free'},
    {n:29, t:'free'},{n:30, t:'free'},{n:31, t:'free'},
    {n:'', t:'empty'},{n:'', t:'empty'},{n:'', t:'empty'},{n:'', t:'empty'}
  ];

  return (
    <div className="glass-panel !rounded-[14px] p-4 lift">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-2 text-[14px] font-[700] text-white">
          <Icon name="calendar" size={14} color="#1a237e" />
          March 2026
        </span>
        <span className="text-[12px] font-[600] text-indigo-400 cursor-pointer hover:underline">
          Set Availability &rarr;
        </span>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1 text-[9px] text-center text-slate-400 font-[700]">
        {daysRow.map((d,i) => <span key={i}>{d}</span>)}
      </div>

      <div className="grid grid-cols-7 gap-[3px] mt-2">
        {grid.map((d, i) => {
          let cls = "aspect-square rounded-[6px] flex items-center justify-center text-[10px] font-[600] cursor-pointer ";
          if (d.t === 'empty') cls += "bg-transparent text-slate-600";
          if (d.t.includes('free')) cls += "bg-emerald-500/20 text-emerald-300";
          if (d.t === 'busy') cls += "bg-red-500/20 text-red-300";
          if (d.t === 'partial') cls += "bg-amber-500/20 text-amber-300";
          if (d.t.includes('today')) cls += " outline outline-[2px] outline-navy-900 outline-offset-[1px]";
          
          return <div key={i} className={cls}>{d.n}</div>;
        })}
      </div>

      <div className="flex items-center gap-3 mt-3">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <div className="w-2.5 h-2.5 rounded-[3px] bg-emerald-500/20" /> Free
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <div className="w-2.5 h-2.5 rounded-[3px] bg-amber-500/20" /> Partial
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <div className="w-2.5 h-2.5 rounded-[3px] bg-red-500/20" /> Busy
        </div>
      </div>
    </div>
  );
}
