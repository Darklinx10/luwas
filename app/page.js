'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeToAuthChanges } from '@/lib/firebaseAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import Image from 'next/image';
import Footer from '@/components/Layout/footer';

export default function HomePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Checking authentication...");
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
            const role = userSnapshot.data().role;
    
            // Set status message based on role
            switch (role) {
              case 'MDRRMC-Admin':
                setStatusMessage("Redirecting to Maps...");
                setTimeout(() => router.replace('/maps'), 500);
                break;
              case 'Brgy-Secretary':
              case 'MDRRMC-Personnel':
              default:
                setStatusMessage("Redirecting to Dashboard...");
                setTimeout(() => router.replace('/dashboard'), 500);
                break;
            }
          } else {
            console.error('User exists but no Firestore doc → redirecting to login');
            setStatusMessage("Redirecting to login...");
            setTimeout(() => router.replace('/login'), 500);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setStatusMessage("Redirecting to login...");
          setTimeout(() => router.replace('/login'), 500);
        }
      } else {
        redirected.current = true;
        setStatusMessage("Redirecting to login...");
        setTimeout(() => router.replace('/login'), 500);
      }
    
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
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-green-50 to-white text-center px-4 gap-2">
      {/* Logos */}
      <div className="flex flex-row items-center justify-center gap-2">
        <Image src="/clarinLogo.png" alt="Clarin Logo" width={80} height={80} className="drop-shadow-lg" />
        <Image src="/mdrrmcLogo.png" alt="MDRRMC Logo" width={150} height={150} className="drop-shadow-lg" />
      </div>

      {/* App Name */}
      <h1 className="text-3xl font-extrabold text-green-700 tracking-wide">LUWAS</h1>
      <h2 className="text-center max-w-xl text-base sm:text-lg md:text-xl font-medium text-gray-600 leading-snug mb-10">
        LGU Unified Web-based Alert System for Risk Mapping and Accident Reporting
      </h2>

      {/* Status */}
      <div className="flex flex-col items-center gap-2 mt-4">
        <svg
          className="animate-spin h-10 w-10 text-green-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-gray-500 text-sm animate-pulse">{statusMessage}</p>
      </div>
      {/* Footer */}
        <Footer />
    </div>
  );
}
