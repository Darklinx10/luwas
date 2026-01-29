import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // Remove the session cookie
  cookies().set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return NextResponse.json({
    message: 'Logged out successfully',
  });
}
