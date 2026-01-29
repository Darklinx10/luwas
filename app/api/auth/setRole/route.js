import admin from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { uid, role } = await request.json();

    if (!uid || !role) {
      return new Response(JSON.stringify({ error: 'UID and role are required' }), { status: 400 });
    }

    await admin.auth().setCustomUserClaims(uid, { role });

    return new Response(JSON.stringify({ message: 'Role set successfully' }), { status: 200 });
  } catch (err) {
    console.error('SetRole error:', err);
    return new Response(JSON.stringify({ error: 'Failed to set role' }), { status: 500 });
  }
}
