'use client';

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';

// 🔐 Normalize email
const normalizeEmail = (email) => email.trim().toLowerCase();

// ----------------------
// AUTH
// ----------------------

export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(
    auth,
    normalizeEmail(email),
    password
  );
  return credential.user;
}

// ----------------------
// USER PROFILE (SERVER-SIDE CREATION)
// ----------------------

// 🔐 CRITICAL: Profile creation must happen server-side ONLY!
// This prevents users from fabricating profile documents with arbitrary roles.
export async function getOrCreateUserProfile(idToken) {
  const res = await fetch('/api/auth/profile/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to create profile');
  }

  return data;
}

// ----------------------
// SESSION (SERVER)
// ----------------------

async function handleResponse(res, fallbackMessage) {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || fallbackMessage);
  }

  return data;
}

export async function createServerSession(idToken) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  return handleResponse(res, 'Failed to create session');
}

export async function fetchCurrentSession() {
  const res = await fetch('/api/auth/me', {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });

  return handleResponse(res, 'Invalid session');
}

export async function logoutFromServer() {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  return handleResponse(res, 'Logout failed');
}

export async function logoutClient() {
  await signOut(auth);
}

// ----------------------
// PASSWORD RESET (SECURE)
// ----------------------

export async function sendResetEmail(email) {
  const cleanEmail = normalizeEmail(email);

  try {
    await sendPasswordResetEmail(auth, cleanEmail);
  } catch (error) {
    // 🔐 Hide user-not-found to prevent email enumeration
    if (error.code === 'auth/user-not-found') {
      return;
    }

    throw error;
  }
}