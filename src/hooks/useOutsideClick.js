import { useEffect } from 'react';

/**
 * Fires `handler` whenever a mousedown event occurs outside of `ref`.
 *
 * Using `mousedown` (not `click`) is critical: it fires before React's
 * synthetic onClick, so the outside-close logic can inspect the target
 * before any click handler has a chance to run — eliminating the race
 * condition where a global `click` listener closes the dropdown before
 * an internal button's onClick fires.
 *
 * @param {React.RefObject} ref     - ref attached to the container element
 * @param {() => void}      handler - called when click is outside ref
 */
export function useOutsideClick(ref, handler) {
  useEffect(() => {
    if (!handler) return;

    const listener = (event) => {
      // Do nothing if ref isn't mounted or the click is inside the ref.
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}
