'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import {
  fetchCurrentSession,
  logoutClient,
  logoutFromServer,
} from '@/features/Authentication/services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfileState] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setProfileState(null);
    setRole(null);
  }, []);

  const setAuthState = useCallback(({ user, profile, role }) => {
    setUser(user || null);
    setProfileState(profile || null);
    setRole(role || null);
  }, []);

  const refreshSession = useCallback(async () => {
    const data = await fetchCurrentSession();

    // ✅ Use entire user object as profile since it contains all fields now
    const userData = data.user || null;
    setAuthState({
      user: userData,
      profile: userData, // Full profile with all fields
      role: userData?.role || null,
    });

    return data;
  }, [setAuthState]);

  const setProfile = useCallback((nextProfile) => {
    setProfileState(nextProfile || null);
    setRole(nextProfile?.role || null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutFromServer();
    } finally {
      try {
        await logoutClient();
      } finally {
        clearAuthState();
        setFirebaseUser(null);
      }
    }
  }, [clearAuthState]);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!mounted) return;

      setFirebaseUser(fbUser || null);

      try {
        if (fbUser) {
          await refreshSession();
        } else {
          clearAuthState();
        }
      } catch (error) {
        clearAuthState();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [clearAuthState, refreshSession]);

  const value = useMemo(
    () => ({
      firebaseUser,
      user,
      profile,
      role,
      loading,
      isAuthenticated: !!user, // 🔐 Added for cleaner auth checking
      refreshSession,
      logout,
      setProfile,
      setAuthState,
      clearAuthState,
    }),
    [
      firebaseUser,
      user,
      profile,
      role,
      loading,
      refreshSession,
      logout,
      setProfile,
      setAuthState,
      clearAuthState,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}