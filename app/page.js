'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeToAuthChanges } from '@/lib/firebaseAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handlePopState = () => {
      window.history.go(1); // Prevent back navigation
    };

    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
    }

    const unsubscribe = subscribeToAuthChanges(async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnapshot = await getDoc(userDocRef);

          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            const role = userData.role;

            // Optional: Redirect based on role
            switch (role) {
              case 'SeniorAdmin':
                router.replace('/maps');
                break;
              case 'Secretary':
                router.replace('/dashboard');
                break;
              case 'OfficeStaff':
                router.replace('/dashboard');
                break;
              default:
                router.replace('/dashboard'); // fallback
            }
          } else {
            console.error('User document not found');
            window.location.replace('/login');
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          window.location.replace('/login');
        }
      } else {
        window.location.replace('/login');
      }
    });

    const loadingTimeout = setTimeout(() => setLoading(false), 2000);

    return () => {
      unsubscribe();
      clearTimeout(loadingTimeout);
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handlePopState);
      }
    };
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
