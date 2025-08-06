'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeToAuthChanges } from '@/lib/firebaseAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default function HomePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const redirected = useRef(false);

  useEffect(() => {
    const handlePopState = () => {
      window.history.go(1); // Prevent back navigation
    };

    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
    }

    const unsubscribe = subscribeToAuthChanges(async (user) => {
      if (redirected.current) return;

      if (user) {
        redirected.current = true;

        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnapshot = await getDoc(userDocRef);

          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            const role = userData.role;

            switch (role) {
              case 'SeniorAdmin':
                router.replace('/maps');
                break;
              case 'Secretary':
              case 'OfficeStaff':
              default:
                router.replace('/dashboard');
                break;
            }
          } else {
            console.error('User document not found');
            router.replace('/login');
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          router.replace('/login');
        }
      } else {
        // No user -> go to login (but only once)
        if (!redirected.current) {
          redirected.current = true;
          router.replace('/login');
        }
      }

      // Set auth check done after processing user
      setAuthChecked(true);
    });

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handlePopState);
      }
    };
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      {!authChecked ? (
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
