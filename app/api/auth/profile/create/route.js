// src/app/api/auth/profile/create/route.js
// 🔐 CRITICAL: Server-side profile creation. NEVER trust client to create profiles.
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken, true);
    const uid = decodedToken.uid;

    console.log('🔍 DEBUG: Profile creation starting');
    console.log('  uid:', uid);
    console.log('  email:', decodedToken.email);

    const userRef = adminDb.collection('users').doc(uid);
    let userSnap;

    try {
      console.log('✅ userRef created successfully');

      userSnap = await userRef.get();
      console.log('✅ userRef.get() succeeded');
      console.log('  exists:', userSnap.exists);
    } catch (dbError) {
      console.error('❌ Firestore error details:', {
        message: dbError.message,
        code: dbError.code,
        name: dbError.name,
        stack: dbError.stack,
      });
      throw dbError;
    }

    // Return existing profile if already created
    if (userSnap.exists) {
      const userData = userSnap.data() || {};
      return NextResponse.json({
        profile: {
          uid,
          email: userData.email || decodedToken.email || '',
          role: userData.role || null,
          displayName: userData.displayName || '',
        },
        isNewUser: false,
      });
    }

    // Create new profile server-side ONLY
    const newProfile = {
      uid,
      email: decodedToken.email || '',
      displayName: decodedToken.name || '',
      role: null, // Admins must assign roles via a protected endpoint
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(newProfile);

    return NextResponse.json({
      profile: {
        uid,
        email: newProfile.email,
        role: newProfile.role,
        displayName: newProfile.displayName,
      },
      isNewUser: true,
    });
  } catch (error) {
    console.error('POST /api/auth/profile/create error:', error);

    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}
