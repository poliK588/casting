import React, { useState, useRef, useMemo } from 'react';
import {
  useFloating,
  useClick,
  useDismiss,
  useInteractions,
  offset,
  flip,
  shift,
  size as floatingSize,
  autoUpdate,
  FloatingPortal,
  FloatingFocusManager
} from '@floating-ui/react';
import { ChevronDown, X, Search } from 'lucide-react';

/**
 * SearchableMultiSelect — Portal-based multi-select with search.
 * Dropdown renders in document.body via FloatingPortal.
 * Handles UUID-based { id, name } objects.
 *
 * Props:
 *   options      - [{ value: UUID, label: string }]
 *   selectedIds  – UUID[]
 *   onChange      – callback(newSelectedIds[])
 *   placeholder   – placeholder text
 *   label         – field label
 */
export default function SearchableMultiSelect({
  options = [],
  selectedIds = [],
  onChange,
  placeholder = 'Select options...',
  label
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      setIsOpen(open);
      if (!open) setSearchTerm('');
    },
    placement: 'bottom-start',
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      floatingSize({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
          });
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

  const selectedOptions = useMemo(
    () => options.filter(opt => selectedIds.includes(opt.value)),
    [options, selectedIds]
  );

  const filteredOptions = useMemo(
    () => options.filter(opt =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedIds.includes(opt.value)
    ),
    [options, selectedIds, searchTerm]
  );

  const toggleOption = (id) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter(item => item !== id)
      : [...selectedIds, id];
    onChange(newSelected);
  };

  const handleTriggerClick = () => {
    setIsOpen(true);
    // Focus search input after portal renders
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
      )}

      {/* ── Trigger Area ── */}
      <div
        ref={refs.setReference}
        {...getReferenceProps()}
        onClick={handleTriggerClick}
        className={`
          min-h-[42px] w-full px-3 py-2 flex flex-wrap items-center gap-2 cursor-pointer rounded-xl
          bg-black/20 border transition-all duration-200
          ${isOpen ? 'border-indigo-500/50 ring-4 ring-indigo-500/10' : 'border-white/10 hover:border-white/20'}
        `}
      >
        {selectedOptions.length === 0 && (
          <span className="text-slate-500 text-[13px]">{placeholder}</span>
        )}

        {selectedOptions.map(opt => (
          <span
            key={opt.value}
            className="flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded-lg text-[12px] font-semibold transition-colors hover:bg-indigo-500/30"
          >
            {opt.label}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleOption(opt.value); }}
              className="hover:text-white transition-colors"
            >
              <X size={13} />
            </button>
          </span>
        ))}

        <div className="ml-auto flex-shrink-0 text-slate-500">
          <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* ── Portal Dropdown ── */}
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false} initialFocus={-1}>
            <div
              ref={refs.setFloating}
              {...getFloatingProps()}
              className="z-[9999] rounded-xl shadow-2xl border border-white/10 overflow-hidden"
              style={{ ...floatingStyles, background: 'rgba(26, 26, 46, 0.95)', backdropFilter: 'blur(20px)' }}
            >
              {/* Search input */}
              <div className="p-2 border-b border-white/5">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    ref={inputRef}
                    type="text"
                    className="w-full h-9 pl-9 pr-3 bg-white/5 border border-white/10 rounded-lg text-[13px] text-white placeholder-slate-600 outline-none focus:border-indigo-500/50 transition-colors"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Options list */}
              <div className="max-h-[220px] overflow-y-auto custom-scrollbar">
                {filteredOptions.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-[13px]">No results found</div>
                ) : (
                  filteredOptions.map(opt => (
                    <div
                      key={opt.value}
                      onClick={() => { toggleOption(opt.value); setSearchTerm(''); }}
                      className="px-4 py-2.5 cursor-pointer transition-colors hover:bg-white/10 border-b border-white/5 last:border-none flex items-center justify-between group"
                    >
                      <span className="text-slate-300 group-hover:text-white text-[13px]">{opt.label}</span>
                      <div className="w-4 h-4 rounded border border-white/20 group-hover:border-indigo-500 transition-colors flex items-center justify-center">
                        {selectedIds.includes(opt.value) && (
                          <div className="w-2 h-2 rounded-sm bg-indigo-500" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </div>
  );
}
