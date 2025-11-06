'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/authContext';
import AppHeader from '../components/AppLogoHeader';
import Footer from '@/components/Layout/footer';

export default function HomePage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const [statusMessage, setStatusMessage] = useState("Checking authentication...");

  useEffect(() => {
    if (!loading) {
      if (user) {
        const redirectPath = role === 'MDRRMC-Admin' ? '/maps' : '/dashboard';
        setStatusMessage(`Redirecting to ${redirectPath.replace('/', '')}...`);
        setTimeout(() => router.replace(redirectPath), 500);
      } else {
        setStatusMessage("Redirecting to login...");
        setTimeout(() => router.replace('/login'), 500);
      }
    }
  }, [user, role, loading, router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-green-50 to-white text-center px-4 gap-2">
      <AppHeader />

      <div className="flex flex-col items-center gap-2 mt-4">
        <svg
          className="animate-spin h-10 w-10 text-green-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
        <p className="text-gray-500 text-sm animate-pulse">{statusMessage}</p>
      </div>

      <Footer />
    </div>
  );
}
