// app/api/checkEmail/route.js
import admin from "firebase-admin";
import { NextResponse } from "next/server";

// Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Try fetching user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    return NextResponse.json({ exists: true, uid: userRecord.uid }, { status: 200 });

  } catch (error) {
    // User not found
    if (error.code === "auth/user-not-found") {
      return NextResponse.json({ exists: false }, { status: 200 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
