'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/authContext';
import AppHeader from '@/components/AppLogoHeader';

export default function HomePage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    router.replace(role === 'MDRRMC-Admin' ? '/household' : '/dashboard');
  }, [user, role, loading, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <AppHeader />

      <div className="mt-6 flex flex-col items-center gap-3">
        <svg
          className="h-10 w-10 animate-spin text-emerald-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
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

        <p className="animate-pulse text-sm text-slate-500" aria-live="polite">
          {loading
            ? 'Checking authentication...'
            : user
              ? 'Redirecting to your workspace...'
              : 'Redirecting to login...'}
        </p>
      </div>
    </div>
  );
}