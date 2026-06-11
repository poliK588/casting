import React, { createContext, useContext } from 'react';
import useSearchState from '../hooks/useSearchState';

const SearchContext = createContext(null);

/**
 * SearchProvider — Mounts the search engine for admin routes only.
 * Wraps useSearchState and exposes it via context.
 */
export function SearchProvider({ children }) {
  const search = useSearchState();
  return (
    <SearchContext.Provider value={search}>
      {children}
    </SearchContext.Provider>
  );
}

/**
 * useSearch — Consume search state from any admin component.
 * Throws if used outside SearchProvider.
 */
export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error('useSearch must be used within <SearchProvider>');
  }
  return ctx;
}
