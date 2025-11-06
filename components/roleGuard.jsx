'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/authContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, allowedRoles = [], loggingOut = false }) {
  const router = useRouter();
  const { profile, loading, user } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState('');

  useEffect(() => {
    if (loading || loggingOut) return;

    let timer;

    if (!user || !profile) {
      setRedirecting(true);
      setRedirectMessage('Redirecting to login...');
      timer = setTimeout(() => router.replace('/login'), 1500);
    } else if (!allowedRoles.includes(profile.role)) {
      setRedirecting(true);
      setRedirectMessage('Access denied. Redirecting...');
      timer = setTimeout(() => router.replace('/unauthorized'), 3000);
    }

    return () => clearTimeout(timer);
  }, [loading, loggingOut, user, profile, allowedRoles, router]);

  if (loading || !profile || redirecting) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner message={redirecting ? redirectMessage : 'Checking access...'} />
      </div>
    );
  }

  return <>{children}</>;
}
