'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/authContext';

export default function ProtectedRoute({ children, allowedRoles = [], loggingOut = false }) {
  const router = useRouter();
  const { profile, loading, user } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (loading || loggingOut) return;

    // Not logged in → show loading first, then redirect
    if (!user || !profile) {
      setRedirecting(true);
      const timer = setTimeout(() => {
        router.replace('/login');
      }, 1500); // 1.5s delay before redirect

      return () => clearTimeout(timer);
    }

    // Logged in but role not allowed
    if (!allowedRoles.includes(profile.role)) {
      setRedirecting(true);
      const timer = setTimeout(() => {
        router.replace('/unauthorized');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [loading, loggingOut, user, profile, allowedRoles, router]);

  // While fetching profile
  if ((loading || !profile) && !loggingOut && !redirecting) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-10 w-10 text-green-600 mb-3"
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
          <p className="text-gray-600 text-sm">Checking access...</p>
        </div>
      </div>
    );
  }

  // Show loading screen during redirect
  if (redirecting) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-10 w-10 text-green-600 mb-3"
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
          <p className="text-gray-600 text-sm">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
