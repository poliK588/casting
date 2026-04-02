import React from 'react';

export default function CastingCalls({ calls }) {
  return (
    <div className="bg-white rounded-[14px] border border-slate-200 p-[18px] lift mt-4">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-2 text-[14px] font-[700] text-slate-900">
          <svg width="14" height="14" fill="none" stroke="#1a237e" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
          Open Casting Calls &mdash; Matched for You
          <span className="bg-green-100 text-green-800 text-[10px] font-[700] px-[7px] py-[1px] rounded-full">
            3 New
          </span>
        </span>
        <span className="text-[12px] font-[600] text-navy-900 cursor-pointer hover:underline flex items-center gap-1">
          Browse All &rarr;
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {calls.map((call, i) => (
          <div key={i} className="flex flex-col gap-2 p-[12px] pb-[14px] rounded-xl border border-slate-100 bg-white transition-all hover:border-navy-200 hover:shadow-md cursor-pointer">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[13px] font-[700] text-slate-900 leading-[1.3]">{call.title}</div>
                <div className="text-[11px] text-slate-500 mt-[2px]">{call.studio}</div>
              </div>
              <span className={`tag ${call.matchColor} text-[9px] shrink-0`}>{call.match} Match</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {call.tags.map(t => (
                <span key={t} className="tag tag-slate text-[10px]">{t}</span>
              ))}
            </div>
            <div className="flex items-center justify-between mt-auto pt-2">
              <div>
                <div className="text-[12px] font-[700] text-emerald-600">{call.rate}</div>
                <div className="text-[10px] text-slate-400">{call.deadline}</div>
              </div>
              <button className="h-7 px-3 bg-navy-900 text-white text-[11px] font-[700] rounded-lg transition-colors hover:bg-navy-800">
                Apply Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
