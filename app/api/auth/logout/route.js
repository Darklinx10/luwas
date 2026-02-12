import { NextResponse } from 'next/server';


export async function POST() {
  const response = NextResponse.json({
    message: 'Logged out successfully',
  });

  // Remove the session cookie
  response.cookies.set({
    name: 'session',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0, // expires immediately
    path: '/',
  });

  return response;
}
