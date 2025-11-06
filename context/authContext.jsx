'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/firebase/config';
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const loadUserData = async (firebaseUser) => {
    if (!firebaseUser) {
      // User logged out → clear state
      setUser(null);
      setRole(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get token claims
      const tokenResult = await getIdTokenResult(firebaseUser, true);
      const claimRole = tokenResult.claims.role || null;

      // Get Firestore profile
      const docRef = doc(db, 'users', firebaseUser.uid);
      let docSnap = await getDoc(docRef);

      // Retry if not found
      let retries = 2;
      let wait = 300;
      while (!docSnap.exists() && retries > 0) {
        await new Promise((res) => setTimeout(res, wait));
        docSnap = await getDoc(docRef);
        retries--;
        wait *= 2; // exponential backoff
      }


      if (docSnap.exists()) {
        const userData = docSnap.data();
        setProfile(userData);
        setRole(claimRole || userData.role || null);
      } else {
        setProfile(null);
        setRole(claimRole || null);
        console.warn('User profile not found after retries');
      }

      setUser(firebaseUser);
    } catch (error) {
      console.error('Error loading user data:', error);
      setUser(null);
      setRole(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      loadUserData(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ profile, setProfile, user, setUser, role, setRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
