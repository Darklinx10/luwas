// src/app/api/auth/me/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const cookieStore = await cookies();

    const sessionCookie = cookieStore.get('session')?.value;
    const sessionToken = cookieStore.get('sessionToken')?.value;

    if (!sessionCookie || !sessionToken) {
      return NextResponse.json(
        { authenticated: false, error: 'Missing session' },
        { status: 401 }
      );
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const uid = decoded.uid;

    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json(
        { authenticated: false, error: 'User not found' },
        { status: 401 }
      );
    }

    const userData = userSnap.data() || {};
    const activeSessionToken = userData.activeSessionToken || null;

    console.log('🔍 Session Validation Debug:');
    console.log('  sessionToken from cookie:', sessionToken);
    console.log('  activeSessionToken from Firestore:', activeSessionToken);
    console.log('  uid:', uid);
    console.log('  userData keys:', Object.keys(userData));

    if (!activeSessionToken || activeSessionToken !== sessionToken) {
      console.log('❌ Session validation failed');
      return NextResponse.json(
        {
          authenticated: false,
          error: 'Session expired or replaced by another login',
          debug: {
            hasCookie: !!sessionToken,
            hasFirestoreToken: !!activeSessionToken,
            match: activeSessionToken === sessionToken,
          },
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        uid,
        email: userData.email || decoded.email || '',
        role: userData.role || decoded.role || null,
        displayName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        // ✅ Return full profile for AuthContext
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        middleName: userData.middleName || '',
        contactNumber: userData.contactNumber || '',
        barangay: userData.barangay || '',
        municipality: userData.municipality || '',
        dateOfBirth: userData.dateOfBirth || '',
        gender: userData.gender || '',
        profilePhoto: userData.profilePhoto || '',
        status: userData.status || 'active',
        createdAt: userData.createdAt || null,
      },
    });
  } catch (error) {
    console.error('GET /api/auth/me error:', error);

    return NextResponse.json(
      { authenticated: false, error: 'Invalid session' },
      { status: 401 }
    );
  }
}