import React, { useState } from 'react';
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
import { ChevronDown } from 'lucide-react';

/**
 * PortalSelect — Custom dropdown rendered via React Portal.
 * Replaces native <select>. Immune to overflow:hidden and z-index issues.
 */
export default function PortalSelect({ label, value, onChange, options = [], placeholder = 'Select...', error }) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
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

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const selectedLabel = React.useMemo(() => {
    const opt = options.find(o => (typeof o === 'object' && o !== null ? o.value : o) === value);
    return opt ? (typeof opt === 'object' ? opt.label : opt) : value;
  }, [options, value]);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
      )}
      <div
        ref={refs.setReference}
        {...getReferenceProps()}
        className={`
          w-full h-10 px-3 flex items-center justify-between cursor-pointer rounded-lg
          text-[13px] bg-black/20 border transition-all outline-none
          ${isOpen ? 'border-indigo-500/50 ring-4 ring-indigo-500/10' : error ? 'border-red-500/40' : 'border-white/10 hover:border-white/20'}
          ${value ? 'text-white' : 'text-slate-500'}
        `}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {error && <p className="text-[10px] text-red-400 font-semibold">{error}</p>}

      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              {...getFloatingProps()}
              className="z-[9999] max-h-[240px] overflow-y-auto rounded-xl shadow-2xl border border-white/10 py-1 custom-scrollbar"
              style={{ ...floatingStyles, background: 'rgba(26, 26, 46, 0.95)', backdropFilter: 'blur(20px)' }}
            >
              <div
                onClick={() => handleSelect('')}
                className="px-4 py-2.5 text-[13px] text-slate-500 hover:bg-white/10 cursor-pointer transition-colors"
              >
                {placeholder}
              </div>
              {options.map((o, idx) => {
                const isObj = typeof o === 'object' && o !== null;
                const optVal = isObj ? o.value : o;
                const optLabel = isObj ? o.label : o;
                return (
                  <div
                    key={isObj ? optVal : `${o}-${idx}`}
                    onClick={() => handleSelect(optVal)}
                    className={`px-4 py-2.5 text-[13px] cursor-pointer transition-colors
                      ${value === optVal ? 'bg-indigo-500/20 text-indigo-300 font-semibold' : 'text-slate-300 hover:bg-white/10'}`}
                  >
                    {optLabel}
                  </div>
                );
              })}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </div>
  );
}

