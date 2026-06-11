/**
 * heightFormat.js — Shared height formatting utility.
 * Converts total inches to feet/inches display string.
 * Used by FilterPanel.jsx and ActiveFiltersBar.jsx.
 */
export function formatInchesToFeet(inches) {
  const ft = Math.floor(inches / 12);
  const inch = inches % 12;
  return `${ft}'${inch}"`;
}
