import React from 'react';
import StatsBar from '../components/admin/StatsBar';
import ActiveFiltersBar from '../components/admin/ActiveFiltersBar';
import Toolbar from '../components/admin/Toolbar';
import TalentGrid from '../components/admin/TalentGrid';

export default function AdminDashboard() {
  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden w-full">
      <StatsBar />
      <ActiveFiltersBar />
      <Toolbar />
      <div className="flex-1 overflow-y-auto">
        <TalentGrid />
      </div>
    </div>
  );
}


