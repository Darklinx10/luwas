'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { auth, db } from '@/lib/firebaseConfig';
import { onAuthStateChanged, getIdTokenResult, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggedOut, setLoggedOut] = useState(false);

  const loadUserData = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setUser(null);
      setProfile(null);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get latest token + claims
      const tokenResult = await getIdTokenResult(firebaseUser, true);
      const claimRole = tokenResult.claims.role || null;

      // Get Firestore profile
      const docRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      let userProfile = null;
      if (docSnap.exists()) {
        userProfile = docSnap.data();
        setProfile(userProfile);
      }

      setUser(firebaseUser);
      setRole(claimRole || userProfile?.role || 'user');
    } catch (error) {
      console.error('[Auth] Error loading user data:', error);
      setUser(null);
      setProfile(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null); // ⚡ triggers cleanup in useEffect
      setRole(null);
      setLoggedOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      loadUserData(firebaseUser);
    });

    return unsubscribe;
  }, [loadUserData]);

  const value = useMemo(
    () => ({
      user,
      profile,
      role,
      loading,
      logout,
    }),
    [user, profile, role, loading, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
