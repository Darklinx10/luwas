'use client';

import Sidebar from '@/components/Layout/sidebar';
import Topbar from '@/components/Layout/topbar';
import { useAuth } from '@/context/authContext';
import { useState } from 'react';
import Footer from '@/components/Layout/footer';


export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const { profile } = useAuth();
  const userRole = profile?.role;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`transition-transform duration-300 ease-in-out
  fixed z-40 inset-y-0 left-0 pl-2 bg-dashboard-bg shadow-md
  transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
  w-16 sm:w-20 md:w-64
`}

      >
        <Sidebar sidebarOpen={sidebarOpen} userRole={userRole} />
      </div>

      {/* Content area (with margin left for sidebar) */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'ml-16 sm:ml-22 md:ml-66' : 'ml-0'
        }`}
      >
        {/* Topbar */}
        <Topbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

        {/* Main content */}
        <main className="flex-1 bg-gradient-to-t from-green-50 to-white p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
