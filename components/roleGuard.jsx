'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/authContext';

export default function ProtectedRoute({ children, allowedRoles = [], loggingOut = false }) {
  const router = useRouter();
  const { profile, loading, user } = useAuth();

  useEffect(() => {
    if (loading || loggingOut) return;

    // Not logged in → redirect to login
    if (!user || !profile) {
      router.replace('/login');
      return;
    }

    // Logged in but role not allowed → redirect to unauthorized page
    if (!allowedRoles.includes(profile.role)) {
      router.replace('/unauthorized');
    }
  }, [loading, loggingOut, user, profile, allowedRoles, router]);

  // Show loader while fetching profile
  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-green-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <p className="text-gray-600 text-sm">Checking access...</p>
        </div>
      </div>
    );
  }

  // User logged in and role allowed
  return <>{children}</>;
}
