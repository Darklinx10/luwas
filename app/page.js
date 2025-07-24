'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeToAuthChanges } from '@/lib/firebaseAuth';
export default function HomePage() {
  const router = useRouter();


  useEffect(() => {
    //Listen for auth changes (login/logout)
    const unsubscribe = subscribeToAuthChanges((user) => {
      if (user) {
        //If authenticated, redirect to dashboard
        router.replace('/dashboard');
      } else {
        // ❌ If not authenticated, redirect to login
        router.replace('/login');
      }
    });

    //Clean up the listener on unmount
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500 text-sm">Redirecting...</p>
    </div>
  );
}
