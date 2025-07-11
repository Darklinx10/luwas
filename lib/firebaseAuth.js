// lib/firebaseAuth.js
import {signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';



export const signIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);
