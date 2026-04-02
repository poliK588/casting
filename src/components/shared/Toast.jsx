import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import Icon from '../shared/Icon';

export default function Toast() {
  const { toast } = useContext(AppContext);
  if (!toast) return null;
  
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-slate-900 text-white pl-4 pr-5 py-3 rounded-xl shadow-2xl text-sm font-[600] max-w-sm"
      style={{ animation: 'slideUp .2s cubic-bezier(.4,0,.2,1)' }}>
      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
        <Icon name="checkCircle" size={14} color="white" />
      </div>
      {toast.msg}
    </div>
  );
}
