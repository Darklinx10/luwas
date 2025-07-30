
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase/config';

let unsubscribeListeners = [];

/**
 * Register a Firestore unsubscribe function to clean up later
 * @param {Function} unsubscribeFn - The unsubscribe function returned from onSnapshot or similar
 */
export const registerListener = (unsubscribeFn) => {
  unsubscribeListeners.push(unsubscribeFn);
};

/** Sign in with email and password */
export const signIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

/** Logout the current user after cleaning up listeners */
export const logout = async () => {
  try {
    // Unsubscribe all registered listeners
    unsubscribeListeners.forEach((unsub) => unsub());
    unsubscribeListeners = [];

    // Sign out from Firebase Auth
    setTimeout(async () => {
      await signOut(auth);
    }, 5000);
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
};

/** Send password reset email */
export const resetPassword = (email) =>
  sendPasswordResetEmail(auth, email);

/** Subscribe to auth state changes */
export const subscribeToAuthChanges = (callback) =>
  onAuthStateChanged(auth, callback);
