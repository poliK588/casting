import React from 'react';
import FilterPanel from '../components/admin/FilterPanel';
import StatsBar from '../components/admin/StatsBar';
import Toolbar from '../components/admin/Toolbar';
import TalentGrid from '../components/admin/TalentGrid';

export default function AdminDashboard() {
  return (
    <div className="flex flex-1 h-full overflow-hidden w-full">
      <FilterPanel />
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <StatsBar />
        <Toolbar />
        <div className="flex-1 overflow-y-auto">
          <TalentGrid />
        </div>
      </div>
    </div>
  );
}
