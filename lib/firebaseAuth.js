
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase/config';

let unsubscribeListeners = [];

/** Register Firestore unsubscribe functions to clean up later */
export const registerListener = (unsubscribeFn) => {
  unsubscribeListeners.push(unsubscribeFn);
};

/** Sign in with email and password */
export const signIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

/** Logout current user and clean up listeners */
export const logout = async () => {
  try {
    unsubscribeListeners.forEach((unsub) => unsub());
    unsubscribeListeners = [];

    await signOut(auth);
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
};

/** Send password reset email (no Firestore access needed) */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent to:', email);
  } catch (error) {
    console.error('Password reset failed:', error);
    throw error;
  }
};

/** Subscribe to auth state changes */
export const subscribeToAuthChanges = (callback) =>
  onAuthStateChanged(auth, callback);

