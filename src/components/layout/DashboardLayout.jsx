import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import TalentSidebar from './TalentSidebar';
import TalentHeader from './TalentHeader';

export default function DashboardLayout({ type }) {
  const isAdmin = type === 'admin';

  return (
    <div className={`flex h-screen w-full overflow-hidden ${isAdmin ? 'bg-slate-50' : 'bg-slate-50'}`}>
      {isAdmin ? <AdminSidebar /> : <TalentSidebar />}
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {isAdmin ? <AdminHeader /> : <TalentHeader />}
        
        {/* Main content area */}
        <main className="flex-1 flex overflow-hidden w-full relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
