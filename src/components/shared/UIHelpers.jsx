import React from 'react';
import Icon from './Icon';

export const StatusBadge = ({ status }) => {
  const cfg = {
    available: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    hold:      'bg-amber-50 text-amber-700 border border-amber-200',
    busy:      'bg-red-50 text-red-600 border border-red-200',
  };
  const label = { available: 'Available', hold: 'On Hold', busy: 'Booked' };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg[status] || cfg.available}`}>{label[status] || status}</span>;
};

export const StatusDot = ({ status }) => {
  const c = { available: 'bg-emerald-400', hold: 'bg-amber-400', busy: 'bg-red-400' };
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c[status] || 'bg-slate-300'}`} />;
};

export const UnionBadge = ({ union }) => {
  const short = { sag:'SAG', afm:'AFM', equity:'AEA', nonunion:'Non' };
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 uppercase tracking-wide">{short[union] || union}</span>;
};

export const SkillTag = ({ skill }) => (
  <span className="inline-flex items-center px-2 py-0.5 bg-navy-50 text-navy-800 rounded-full text-[10px] font-[600]">{skill}</span>
);

export const StarRating = ({ rating }) => (
  <span className="flex items-center gap-1">
    <Icon name="starFill" size={13} color="#f59e0b" />
    <span className="text-[12px] font-[700] text-slate-700">{rating}</span>
  </span>
);
