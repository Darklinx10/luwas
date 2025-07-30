'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeToAuthChanges } from '@/lib/firebaseAuth';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true); // 🔄 loading state

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

    // Timeout for visual feedback even if redirect is fast
    const loadingTimeout = setTimeout(() => setLoading(false), 2000);

    //Clean up the listener on unmount
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      {loading ? (
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Checking authentication...</p>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">Redirecting...</p>
      )}
    </div>
  );
}
