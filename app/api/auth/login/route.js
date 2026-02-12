import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

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

   // Set cookie using NextResponse
    const response = NextResponse.json({ message: "Logged in successfully" });
    response.cookies.set({
      name: "session",
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: expiresIn / 1000,
      sameSite: "strict",
      path: "/",
    });


    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Invalid ID token or session creation failed" },
      { status: 401 }
    );
  }
}