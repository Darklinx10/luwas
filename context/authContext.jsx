'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase/config'; // Firebase authentication instance
import { onAuthStateChanged } from 'firebase/auth'; // Listener for auth state changes

// Create a new context for authentication
const AuthContext = createContext();

// AuthProvider wraps the app and provides the current user to children components
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Holds the current logged-in user

  useEffect(() => {
    // Subscribe to Firebase authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null); // Update state with user or null if signed out
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs once on mount

  // Provide the current user to all child components
  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};

// Custom hook to easily access auth context in components
export const useAuth = () => useContext(AuthContext);

