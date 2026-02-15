'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { auth, db } from '@/lib/firebaseConfig';
import { onAuthStateChanged, getIdTokenResult, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Create the AuthContext
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // -------------------------
  // States
  // -------------------------
  const [user, setUser] = useState(null);        // Firebase user object
  const [profile, setProfile] = useState(null);  // Firestore profile document
  const [role, setRole] = useState(null);        // User role from Firestore or token
  const [loading, setLoading] = useState(true);  // Loading state for auth/profile
  const [skipProfileRedirectToast, setSkipProfileRedirectToast] = useState(false);

  // -------------------------
  // Load user + profile data
  // -------------------------
  const loadUserData = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      // No user logged in
      setUser(null);
      setProfile(null);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get latest ID token + custom claims
      const tokenResult = await getIdTokenResult(firebaseUser, true);
      const claimRole = tokenResult.claims.role || null;

      // Get Firestore profile
      const docRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      let userProfile = null;
      if (docSnap.exists()) {
        userProfile = docSnap.data();
        setProfile(userProfile); // ✅ set profile in context
      }

      setUser(firebaseUser);
      setRole(claimRole || userProfile?.role || 'user'); // default role 'user'
    } catch (error) {
      console.error('[Auth] Error loading user data:', error);
      setUser(null);
      setProfile(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // -------------------------
  // Logout function
  // -------------------------
  const logout = useCallback(async () => {
    try {
      setSkipProfileRedirectToast(true); // ✅ skip toast when logging out
      await signOut(auth);
      setUser(null);
      setProfile(null);
      setRole(null);
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      throw error;
    }
  }, []);

  // -------------------------
  // Watch auth state changes
  // -------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      loadUserData(firebaseUser);
    });

    return () => unsubscribe();
  }, [loadUserData]);

  // -------------------------
  // Context value
  // -------------------------
  const value = useMemo(() => ({
    user,
    profile,
    setProfile,  // ✅ provide setProfile for EditProfilePage
    role,
    loading,
    logout,
    skipProfileRedirectToast,
    setSkipProfileRedirectToast,
  }), [user, profile, role, loading, logout, skipProfileRedirectToast]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// -------------------------
// Custom hook
// -------------------------
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};