// src/app/api/checkEmail/route.js
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    try {
      const userRecord = await adminAuth.getUserByEmail(email.trim());

      return NextResponse.json({
        exists: true,
        uid: userRecord.uid,
      });
    } catch (error) {
      if (error?.code === 'auth/user-not-found') {
        return NextResponse.json(
          { exists: false, error: 'This email is not registered.' },
          { status: 404 }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error('POST /api/checkEmail error:', error);

    return NextResponse.json(
      { error: 'Failed to check email.' },
      { status: 500 }
    );
  }
}