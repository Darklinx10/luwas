'use client';

import Sidebar from '@/components/Layout/sidebar';
import Topbar from '@/components/Layout/topbar';
import { useAuth } from '@/context/authContext';
import { useState, useEffect } from 'react';
import useIsMobile from '@/hooks/useMobile';

export default function DashboardLayout({ children }) {
  const isMobile = useIsMobile();  // <--- use the hook here
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const { profile } = useAuth();
  const userRole = profile?.role;

  // Force close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

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

      {/* Content area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'ml-16 sm:ml-20 md:ml-66' : 'ml-0'
        }`}
      >
        <Topbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <main className="flex-1 bg-gradient-to-t from-green-50 to-white p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
