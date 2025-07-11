'use client';

import { useState } from 'react';
import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex">
      {/* Sidebar */}
      <div
        className={`transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed z-40 inset-y-0 left-0 w-64 pl-2 bg-white shadow-md`}
      >
        <Sidebar sidebarOpen={sidebarOpen} />
      </div>

      {/* Content area (with margin left for sidebar) */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-67' : 'ml-0'}`}>
        {/* Topbar */}
        <Topbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
     

        {/* Main content */}
        <main className="flex-1 bg-white p-6 ">
        {children}
        </main>
      </div>
    </div>
  );
}
