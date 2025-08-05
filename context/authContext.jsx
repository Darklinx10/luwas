// AuthContext.js
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          let docSnap = await getDoc(docRef);

          // Try up to 3 times to get the doc (helps with new writes not showing instantly)
          let retries = 2;
          while (!docSnap.exists() && retries > 0) {
            await new Promise(res => setTimeout(res, 300)); // wait 300ms
            docSnap = await getDoc(docRef);
            retries--;
          }

          if (docSnap.exists()) {
            const userData = docSnap.data();
            setRole(userData.role);
            setProfile(userData); // ✅ fix: now profile will be usable
          } else {
            console.warn('User profile not found after retries');
            setRole('Guest');
            setProfile(null); // or handle as needed
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setRole(null);
        }
      }


      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ profile , setProfile, user, setUser, role, setRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
