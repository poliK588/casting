import React from 'react';

export default function RecentMessages({ messages }) {
  return (
    <div className="bg-white rounded-[14px] border border-slate-200 p-[18px] lift mt-4">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-2 text-[14px] font-[700] text-slate-900">
          <svg width="14" height="14" fill="none" stroke="#1a237e" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
          Recent Messages
          <span className="bg-red-100 text-red-800 text-[10px] font-[700] px-[7px] py-[1px] rounded-full">
            6
          </span>
        </span>
        <span className="text-[12px] font-[600] text-navy-900 cursor-pointer hover:underline flex items-center gap-1">
          Inbox &rarr;
        </span>
      </div>

      <div className="flex flex-col">
        {messages.map((msg, i) => (
          <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-[10px] cursor-pointer transition-colors hover:bg-slate-50">
            {msg.isSystem ? (
              <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center shrink-0">
                <svg width="16" height="16" fill="none" stroke="#1a237e" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
            ) : (
              <img src={msg.avatar} alt={msg.name} className="w-9 h-9 rounded-full object-cover shrink-0" onError={(e) => e.target.style.display='none'} />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-[700] text-slate-900">
                {msg.name} <span className="text-[9px] text-slate-400 font-[400] ml-0.5">{msg.role}</span>
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-[1px]">{msg.preview}</div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1 ml-auto">
              <span className="text-[10px] text-slate-400">{msg.time}</span>
              {msg.unread && <div className="w-[7px] h-[7px] bg-navy-900 rounded-full" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
