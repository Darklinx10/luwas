'use client';

import Sidebar from '@/components/Layout/sidebar';
import Topbar from '@/components/Layout/topbar';
import { useAuth } from '@/context/authContext';
import { useState, useEffect } from 'react';
import useIsMobile from '@/hooks/useMobile';

export default function DashboardLayout({ children }) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const { role } = useAuth();

  // Force close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className={`transition-transform duration-300 ease-in-out
          fixed inset-y-0 left-0 z-40 bg-dashboard-bg shadow-md
          transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          w-[72px] md:w-[272px]
        `}
      >
        <Sidebar sidebarOpen={sidebarOpen} userRole={role} />
      </div>

      <div
        className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'ml-[72px] md:ml-[272px]' : 'ml-0'
        }`}
      >
        <Topbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-t from-green-50 to-white p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
