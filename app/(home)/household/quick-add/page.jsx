'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/authContext';
import HouseholdForm from '@/features/Households/components/Forms/HouseholdForm';

function PageLoader({ text = 'Loading form...' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center">
        <svg
          className="mb-3 h-10 w-10 animate-spin text-emerald-600"
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
        <p className="text-sm text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-red-600">Access Denied</h2>
        <p className="mt-2 text-sm text-slate-500">
          This page is restricted to Brgy-Secretary users.
        </p>
      </div>
    </div>
  );
}

export default function QuickAddHouseholdPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    if (profile && profile.role !== 'Brgy-Secretary') {
      router.push('/');
      return;
    }

    setLoading(false);
  }, [user, profile, router]);

  if (loading || !user) {
    return <PageLoader text="Loading household registration form..." />;
  }

  if (profile?.role !== 'Brgy-Secretary') {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-4 md:py-6">
      <div className="mx-auto max-w-6xl px-4">
        <HouseholdForm
          userId={user?.uid}
          onComplete={(householdId) => {
            router.push(`/household/edit/${householdId}`);
          }}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}