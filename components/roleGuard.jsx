'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/authContext';
import LoadingSpinner from './LoadingSpinner';


export default function RoleGuard({
  allowedRoles = [],
  children,
  redirectTo = '/unauthorized',
}) {

   const router = useRouter();
  const { role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!role || !allowedRoles.includes(role)) {
      router.replace(redirectTo);
    }
  }, [role, loading, allowedRoles, redirectTo, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner/>
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return null;
  }

  return children;
}