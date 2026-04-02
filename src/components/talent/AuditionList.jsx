import React from 'react';
import Icon from '../shared/Icon';

export default function AuditionList({ auditions }) {
  return (
    <div className="bg-white rounded-[14px] border border-slate-200 p-[18px] lift">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-2 text-[14px] font-[700] text-slate-900">
          <Icon name="play" size={14} color="#1a237e" />
          Current Auditions
          <span className="bg-navy-100 text-navy-900 text-[10px] font-[700] px-[7px] py-[1px] rounded-full">
            {auditions.length}
          </span>
        </span>
        <span className="text-[12px] font-[600] text-navy-900 cursor-pointer hover:underline flex items-center gap-1">
          View All &rarr;
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {auditions.map((aud, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white transition-all hover:border-navy-200 hover:shadow-md cursor-pointer">
            <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 text-[18px] ${aud.iconBg}`}>
              {aud.iconEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-[700] text-slate-900">{aud.title}</div>
              <div className="text-[11px] text-slate-500 mt-[1px] truncate">{aud.subtitle}</div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1 ml-auto">
              <span className={`tag ${aud.tagColor} text-[11px]`}>{aud.status}</span>
              <span className="text-[10px] text-slate-400 font-[500]">{aud.deadline}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
