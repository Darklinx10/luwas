import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase/config';

/** Sign in with email and password */
export const signIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

/** Logout the current user */
export const logout = () => signOut(auth);

/** Send password reset email */
export const resetPassword = (email) =>
  sendPasswordResetEmail(auth, email);

/** Subscribe to auth state changes */
export const subscribeToAuthChanges = (callback) =>
  onAuthStateChanged(auth, callback);
