import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import admin from 'firebase-admin';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

const SESSION_EXPIRES_IN = 60 * 60 * 24 * 5 * 1000; // 5 days

// Handle POST requests to /api/auth/login
export async function POST(request) {
  try {
    // Parse ID token from request body
    const { idToken } = await request.json();

    // Validate input
    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify Firebase ID token (checks authenticity + revocation)
    const decodedToken = await adminAuth.verifyIdToken(idToken, true);
    const uid = decodedToken.uid;

    // Reference to user document in Firestore
    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();

    // Ensure user profile exists in database
    if (!userSnap.exists) {
      return NextResponse.json(
        { error: 'User profile not found. Please contact admin.' },
        { status: 403 }
      );
    }

    // Extract user data and role
    const userData = userSnap.data() || {};
    const role = userData.role || null;

    // Note: Role can be null for new users - admins assign roles via protected endpoint

    // Create a Firebase session cookie (long-lived authentication)
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN,
    });

    // Generate a custom session token for tracking/logging sessions
    const sessionToken = crypto.randomUUID();

    console.log('📝 Setting session token:', sessionToken);

    // Update user document with session info
    try {
      await userRef.update({
        activeSessionToken: sessionToken, // track active session
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(), // record login time
      });
      console.log('✅ Session token saved to Firestore for uid:', uid);
    } catch (updateError) {
      console.error('❌ Failed to update activeSessionToken:', updateError);
      throw updateError;
    }

    // Prepare success response
    const response = NextResponse.json({
      success: true,
      message: 'Session created successfully',
    });

    // Set secure HTTP-only cookie for Firebase session
    response.cookies.set('session', sessionCookie, {
      httpOnly: true, // prevents access via JavaScript (security)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
      sameSite: 'lax', // CSRF protection
      path: '/', // available across entire site
      maxAge: SESSION_EXPIRES_IN / 1000, // convert ms to seconds
    });

    // Set additional session token cookie (for custom validation)
    response.cookies.set('sessionToken', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_EXPIRES_IN / 1000,
    });

    // Return response with cookies
    return response;

  } catch (error) {
    // Log error for debugging
    console.error('POST /api/auth/login error:', error);

    // Return generic authentication failure
    return NextResponse.json(
      { error: 'Invalid ID token or session creation failed' },
      { status: 401 }
    );
  }
}