// AuthContext.js
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
      setUser(null);
      setRole(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      // 🔹 Force refresh claims so they’re never stale
      const tokenResult = await getIdTokenResult(firebaseUser, true);
      const claimRole = tokenResult.claims.role || null;
      setRole(claimRole);

      // 🔹 Get Firestore profile (with retry for new writes)
      const docRef = doc(db, 'users', firebaseUser.uid);
      let docSnap = await getDoc(docRef);
      let retries = 2;
      while (!docSnap.exists() && retries > 0) {
        await new Promise(res => setTimeout(res, 300));
        docSnap = await getDoc(docRef);
        retries--;
      }

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setProfile(userData);
        if (!claimRole) {
          // If role not in claims, fall back to Firestore
          setRole(userData.role || null);
        }
      } else {
        console.warn('User profile not found after retries');
        setProfile(null);
      }

      setUser(firebaseUser);
    } catch (error) {
      console.error('Error loading user data:', error);
      setRole(null);
      setProfile(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(true);
      loadUserData(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  

  return (
    <AuthContext.Provider value={{ profile, setProfile, user, setUser, role, setRole, loading}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);