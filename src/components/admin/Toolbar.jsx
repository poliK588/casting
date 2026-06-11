import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { useSearch } from '../../context/SearchContext';
import Icon from '../shared/Icon';

export default function Toolbar() {
  const { results } = useSearch();
  const { viewMode, setViewMode } = useContext(AppContext);

  return (
    <div className="flex items-center justify-between px-5 h-11 border-b border-slate-200 bg-white flex-shrink-0 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-slate-400">Talent Database</span>
        <Icon name="chevRight" size={12} color="#cbd5e1" />
        <span className="text-xs font-bold text-slate-700">All Talent</span>
        <span className="ml-1 text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 flex-shrink-0">
          {results.length} result{results.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* View toggle */}
        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
          <button onClick={() => setViewMode('grid')}
            className={`h-7 w-8 flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-navy-50 text-navy-700' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Icon name="grid" size={13} color="currentColor" />
          </button>
          <button onClick={() => setViewMode('list')}
            className={`h-7 w-8 flex items-center justify-center border-l border-slate-200 transition-colors ${viewMode === 'list' ? 'bg-navy-50 text-navy-700' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Icon name="listView" size={13} color="currentColor" />
          </button>
        </div>

        {/* Import/Export Placeholders */}
        <button className="flex items-center gap-1.5 h-7 px-3 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors">
          <Icon name="upload" size={12} color="currentColor" />
          Import
        </button>
        <button className="flex items-center gap-1.5 h-7 px-3 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors">
          <Icon name="download" size={12} color="currentColor" />
          Export
        </button>
      </div>
    </div>
  );
}
