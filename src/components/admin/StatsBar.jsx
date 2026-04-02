import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import Icon from '../shared/Icon';

export default function StatsBar() {
  const { talent, shortlist, setShowNewProject } = useContext(AppContext);
  const available = talent.filter(t => t.status === 'available').length;
  const onHold    = talent.filter(t => t.status === 'hold').length;
  const booked    = talent.filter(t => t.status === 'busy').length;
  const avgRating = (talent.reduce((s,t) => s + t.rating, 0) / talent.length).toFixed(1);

  const stats = [
    { label:'Total Talent', value: talent.length, icon:'users', color:'text-navy-700', bg:'bg-navy-50' },
    { label:'Available',    value: available,      icon:'checkCircle', color:'text-emerald-600', bg:'bg-emerald-50' },
    { label:'On Hold',      value: onHold,         icon:'info',       color:'text-amber-600',   bg:'bg-amber-50' },
    { label:'Booked Out',   value: booked,         icon:'lock',       color:'text-red-500',     bg:'bg-red-50' },
    { label:'Avg Rating',   value: avgRating,      icon:'starFill',   color:'text-purple-600',  bg:'bg-purple-50' },
  ];

  return (
    <div className="flex items-center gap-4 px-5 py-2.5 bg-white border-b border-slate-200 flex-shrink-0 overflow-x-auto">
      {stats.map((s, i) => (
        <React.Fragment key={s.label}>
          {i > 0 && <div className="w-px h-7 bg-slate-200 flex-shrink-0" />}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
              <Icon name={s.icon} size={15} color="currentColor" className={s.color} />
            </div>
            <div>
              <p className="text-lg font-[800] text-slate-800 leading-none">{s.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-[500]">{s.label}</p>
            </div>
          </div>
        </React.Fragment>
      ))}
      <div className="flex-1" />
      <button onClick={() => setShowNewProject(true)}
        className="flex-shrink-0 flex items-center gap-2 h-7 px-3 bg-navy-50 border border-navy-200 rounded-lg text-xs text-navy-700 font-semibold hover:bg-navy-100 transition-colors">
        <Icon name="folder" size={12} color="#0f172a" />
        <span>Create Project</span>
        <span className="bg-amber-100 text-amber-700 text-[9px] font-[800] rounded-full px-1.5 min-w-[18px] h-4 flex items-center justify-center">
          {shortlist.size}
        </span>
      </button>
    </div>
  );
}
