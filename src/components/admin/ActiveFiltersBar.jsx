import React from 'react';
import { useSearch } from '../../context/SearchContext';
import { formatInchesToFeet } from '../../utils/heightFormat';
import Icon from '../shared/Icon';

/**
 * ActiveFiltersBar — Renders removable chips for every active filter.
 * Height chips display formatted feet/inches via shared utility.
 * Only visible when at least one filter is active.
 */
export default function ActiveFiltersBar() {
  const { activeFilters, clearFilters } = useSearch();

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-5 py-2 bg-white border-b border-slate-200 flex-shrink-0">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-1 flex-shrink-0">
        Active
      </span>
      <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
        {activeFilters.map(f => {
          // Format height chips with feet/inches display
          let label = f.label;
          if (f.key === 'height' && label.includes('″')) {
            const match = label.match(/(\d+)″–(\d+)″/);
            if (match) {
              label = `Height ${formatInchesToFeet(+match[1])} – ${formatInchesToFeet(+match[2])}`;
            }
          }
          return (
            <button key={f.key} onClick={f.remove}
              className="flex items-center gap-1 px-2 py-0.5 bg-navy-100 text-navy-800 rounded-full text-[11px] font-semibold hover:bg-navy-200 transition-colors">
              {label}
              <Icon name="close" size={10} color="currentColor" />
            </button>
          );
        })}
      </div>
      <button onClick={clearFilters}
        className="text-xs text-navy-700 font-semibold hover:underline transition-colors flex-shrink-0">
        Clear all
      </button>
    </div>
  );
}
