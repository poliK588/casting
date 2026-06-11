import React, { createContext, useState, useCallback } from 'react';

export const AppContext = createContext();

/**
 * AppProvider — Pure UI state context.
 * Search/filter state has moved to SearchContext (admin-only).
 */
export function AppProvider({ children }) {
  const [shortlist, setShortlist] = useState(new Set());
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const [talentModal, setTalentModal] = useState(null);
  const [showAddTalent, setShowAddTalent] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg) => {
    setToast({ msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const toggleShortlist = useCallback((id) => {
    setShortlist(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      shortlist, toggleShortlist,
      activeNav, setActiveNav,
      sidebarExpanded, setSidebarExpanded,
      viewMode, setViewMode,
      talentModal, setTalentModal,
      showAddTalent, setShowAddTalent,
      showNewProject, setShowNewProject,
      toast, showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}
