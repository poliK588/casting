import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

const DROPDOWN_LIMIT = 20;
const INPUT_DEBOUNCE = 250; // ms (#13)

/**
 * Combobox — Async UUID-based multi-select.
 * Hardened: debounced input, result cap, memoized filtering (#13).
 *
 * Props:
 *   items       — [{id, name}] full reference list
 *   selected    — uuid[] currently selected
 *   onToggle    — (uuid) => void
 *   placeholder — input placeholder
 *   disabled    — disable interaction
 */
export default function Combobox({ items, selected, onToggle, placeholder = 'Search…', disabled = false }) {
  const [rawQuery, setRawQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounce input → debouncedQuery (#13)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(rawQuery);
    }, INPUT_DEBOUNCE);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [rawQuery]);

  // Build a Set for O(1) selected lookup
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  // Memoized filtering: exclude selected, match query, cap at DROPDOWN_LIMIT (#13)
  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    const out = [];
    for (const item of items) {
      if (out.length >= DROPDOWN_LIMIT) break;
      if (selectedSet.has(item.id)) continue;
      if (q && !item.name.toLowerCase().includes(q)) continue;
      out.push(item);
    }
    return out;
  }, [items, selectedSet, debouncedQuery]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setRawQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightIndex(0);
  }, [filtered.length, debouncedQuery]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const item = listRef.current.children[highlightIndex];
      if (item) item.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex, isOpen]);

  const handleSelect = useCallback((id) => {
    onToggle(id);
    setRawQuery('');
    setDebouncedQuery('');
    inputRef.current?.focus();
  }, [onToggle]);

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true);
      e.preventDefault();
      return;
    }
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(prev => Math.min(prev + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[highlightIndex]) {
          handleSelect(filtered[highlightIndex].id);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setRawQuery('');
        break;
      default:
        break;
    }
  };

  // Resolve selected UUIDs to names (memoized)
  const selectedItems = useMemo(() =>
    selected.map(id => items.find(i => i.id === id)).filter(Boolean),
    [selected, items]
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Selected chips */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {selectedItems.map(item => (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              disabled={disabled}
              className="flex items-center gap-1 pl-2 pr-1.5 py-0.5 bg-navy-50 text-navy-800 rounded-full text-[11px] font-semibold hover:bg-navy-100 transition-colors disabled:opacity-50"
            >
              {item.name}
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
          width="12" height="12" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4-4" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={rawQuery}
          onChange={(e) => {
            setRawQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-7 pl-7 pr-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-navy-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && filtered.length > 0 && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto"
          role="listbox"
        >
          {filtered.map((item, idx) => (
            <button
              key={item.id}
              role="option"
              aria-selected={idx === highlightIndex}
              onClick={() => handleSelect(item.id)}
              onMouseEnter={() => setHighlightIndex(idx)}
              className={`flex items-center w-full px-3 py-1.5 text-xs text-left transition-colors cursor-pointer
                ${idx === highlightIndex ? 'bg-navy-50 text-navy-900' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}

      {isOpen && !disabled && debouncedQuery && filtered.length === 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 px-3 py-2">
          <p className="text-xs text-slate-400">No matches</p>
        </div>
      )}
    </div>
  );
}
