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
      // ✅ User logged out: clear state
      setUser(null);
      setRole(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      // 🔹 Refresh ID token claims
      const tokenResult = await getIdTokenResult(firebaseUser, true);
      const claimRole = tokenResult.claims.role || null;
      setRole(claimRole);

      // 🔹 Fetch Firestore profile
      const docRef = doc(db, 'users', firebaseUser.uid);
      let docSnap = await getDoc(docRef);

      // Retry in case document hasn't propagated yet
      let retries = 2;
      while (!docSnap.exists() && retries > 0) {
        await new Promise(res => setTimeout(res, 300));
        docSnap = await getDoc(docRef);
        retries--;
      }

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setProfile(userData);
        // Fallback to Firestore role if claim is missing
        if (!claimRole) setRole(userData.role || null);
      } else {
        setProfile(null);
        console.warn('User profile not found after retries');
      }

      setUser(firebaseUser);
    } catch (error) {
      console.error('Error loading user data:', error);
      setUser(null);
      setRole(null);
      setProfile(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // ✅ Only call loadUserData if user exists, else clear state safely
      if (firebaseUser) {
        setLoading(true);
        loadUserData(firebaseUser);
      } else {
        setUser(null);
        setRole(null);
        setProfile(null);
        setLoading(false);
      }
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
