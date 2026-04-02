import React from 'react';

export default function MediaHighlights({ mediaItems }) {
  return (
    <div className="bg-white rounded-[14px] border border-slate-200 p-[18px] lift mt-4">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-2 text-[14px] font-[700] text-slate-900">
          <svg width="14" height="14" fill="none" stroke="#1a237e" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path strokeLinecap="round" d="M3 9h18M9 21V9"/></svg>
          Media Highlights
        </span>
        <span className="text-[12px] font-[600] text-navy-900 cursor-pointer hover:underline flex items-center gap-1">
          Gallery &rarr;
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {mediaItems.map((item, i) => (
          <div key={i} className={`aspect-square rounded-[10px] overflow-hidden relative cursor-pointer group ${item.type==='add' ? 'bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1' : (item.bgUrl ? 'bg-navy-900' : 'bg-slate-100')}`}>
            {item.type === 'add' ? (
              <>
                <svg width="20" height="20" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 4v16m8-8H4"/></svg>
                <div className="text-[9px] font-[700] text-slate-400 text-center">Add Media</div>
              </>
            ) : item.type === 'reel' ? (
              <>
                <img src={item.bgUrl} alt="Reel" className="w-full h-full object-cover object-top opacity-60 group-hover:scale-105 transition-transform duration-200" />
                <div className="absolute inset-0 bg-navy-900/50 flex items-center justify-center">
                  <div className="w-9 h-9 bg-white/95 rounded-full flex items-center justify-center">
                    <svg width="14" height="14" fill="#1a237e" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
                <div className="absolute bottom-[5px] right-[5px] bg-[#1a237e] text-white text-[9px] font-[700] px-1.5 py-0.5 rounded backdrop-blur">
                  Reel
                </div>
              </>
            ) : (
              <>
                <img src={item.url} alt={item.badge} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-200" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <div className="absolute bottom-[5px] right-[5px] bg-black/60 text-white text-[9px] font-[700] px-1.5 py-0.5 rounded backdrop-blur">
                  {item.badge}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
