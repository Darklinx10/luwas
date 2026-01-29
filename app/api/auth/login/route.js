import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import admin from '@/lib/firebaseAdmin';

export async function POST(request) {
  try {
    const { idToken, role } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Decode token to get uid
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 1️⃣ Set custom claim (role) on the user
    // This ensures role is included in session cookie and ID token
    await admin.auth().setCustomUserClaims(uid, { role: role || 'MDRRMC-Admin' });

    // Create a session cookie valid for 5 days
    const expiresIn = 5 * 24 * 60 * 60 * 1000; // ms
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn });

    // Get the cookie store first
    const cookieStore = cookies();  
    await cookieStore.set('session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: expiresIn / 1000,
      path: '/',
    });


    return NextResponse.json({
      message: 'Logged in successfully',
    });

  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'Invalid ID token or session creation failed' },
      { status: 401 }
    );
  }
}
