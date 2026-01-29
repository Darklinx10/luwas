'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/firebase/config';
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

/**
 * AuthProvider wraps your app and provides:
 * - user: Firebase user object
 * - profile: Firestore user profile
 * - role: role from custom claims or Firestore
 * - loading: boolean while checking auth
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Firebase user
  const [profile, setProfile] = useState(null); // Firestore profile
  const [role, setRole] = useState(null);       // Role from claims or profile
  const [loading, setLoading] = useState(true);

  const loadUserData = async (firebaseUser) => {
    if (!firebaseUser) {
      // User logged out → clear state
      setUser(null);
      setProfile(null);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Force refresh the token to include latest custom claims
      await firebaseUser.getIdToken(true);

      // 1️⃣ Get custom claims from ID token
      const tokenResult = await getIdTokenResult(firebaseUser, true);
      const claimRole = tokenResult.claims.role || null;

      // 2️⃣ Get Firestore user profile
      const docRef = doc(db, 'users', firebaseUser.uid);
      let docSnap = await getDoc(docRef);

      // Retry if profile not yet created
      let retries = 2;
      let wait = 300;
      while (!docSnap.exists() && retries > 0) {
        await new Promise((res) => setTimeout(res, wait));
        docSnap = await getDoc(docRef);
        retries--;
        wait *= 2;
      }

      let userProfile = null;
      if (docSnap.exists()) {
        userProfile = docSnap.data();
        setProfile(userProfile);
      }

      setUser(firebaseUser);
      setRole(claimRole || userProfile?.role || 'user'); // fallback to 'user'
    } catch (error) {
      console.error('[Auth] Error loading user data:', error);
      setUser(null);
      setProfile(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('[Auth] onAuthStateChanged fired', firebaseUser);
      loadUserData(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, setProfile, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
