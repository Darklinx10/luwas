'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/authContext';
import LoadingSpinner from './LoadingSpinner';

export default function RoleGuard({ children, allowedRoles = [] }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (loading) return;

    let timer;
    const role = profile?.role;

    // 🔒 Not authenticated
    if (!user) {
      setRedirecting(true);
      timer = setTimeout(() => router.replace('/login'), 1500);
    }
    // 🚫 Authenticated but not authorized
    else if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
      setRedirecting(true);
      timer = setTimeout(() => router.replace('/unauthorized'), 2000);
    }

    return () => clearTimeout(timer);
  }, [user, profile, loading, allowedRoles, router]);

  // ⏳ Loading / redirect screen
  if (loading || redirecting) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner/>
      </div>
    );
  }

  // ✅ Authorized
  return <>{children}</>;
}
