/**
 * app/api/accidents/[id]/route.js
 *
 * GET /api/accidents/[id] - Fetch a single accident
 * PATCH /api/accidents/[id] - Update an accident
 * DELETE /api/accidents/[id] - Delete an accident
 */

import admin from 'firebase-admin';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSessionUser } from '@/lib/auth/getSessionUser';

function serializeTimestamps(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (obj._seconds !== undefined && obj._nanoseconds !== undefined) {
    return new Date(obj._seconds * 1000 + obj._nanoseconds / 1000000).toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeTimestamps);
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  const serialized = {};
  for (const key in obj) {
    serialized[key] = serializeTimestamps(obj[key]);
  }
  return serialized;
}

async function getAccidentDoc(id) {
  const docRef = adminDb.collection('accidents').doc(id);
  const docSnap = await docRef.get();

  return { docRef, docSnap };
}

export async function GET(request, { params }) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { docSnap } = await getAccidentDoc(id);

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Accident not found' }, { status: 404 });
    }

    const accident = docSnap.data() || {};
    if (user.role === 'Brgy-Secretary' && accident.barangay !== user.barangay) {
      return NextResponse.json(
        { error: 'Forbidden: No access to this accident' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      accident: { id, ...serializeTimestamps(accident) },
    });
  } catch (error) {
    console.error('GET /api/accidents/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accident' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['MDRRMC-Personnel', 'MDRRMC-Admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only MDRRMC personnel can update accidents' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const updateData = await request.json();

    const allowed = ['type', 'severity', 'description', 'datetime', 'imageUrl'];
    const updates = {};
    for (const key of allowed) {
      if (key in updateData) {
        updates[key] = updateData[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { docRef, docSnap } = await getAccidentDoc(id);

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Accident not found' }, { status: 404 });
    }

    const accident = docSnap.data() || {};
    if (user.role === 'Brgy-Secretary' && accident.barangay !== user.barangay) {
      return NextResponse.json(
        { error: 'Forbidden: No access to this accident' },
        { status: 403 }
      );
    }

    await docRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: user.uid,
    });

    const updatedSnap = await docRef.get();

    return NextResponse.json({
      success: true,
      accident: { id, ...serializeTimestamps(updatedSnap.data() || {}) },
    });
  } catch (error) {
    console.error('PATCH /api/accidents/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update accident' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['MDRRMC-Personnel', 'MDRRMC-Admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only MDRRMC personnel can delete accidents' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { docRef, docSnap } = await getAccidentDoc(id);

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Accident not found' }, { status: 404 });
    }

    const accident = docSnap.data() || {};
    if (user.role === 'Brgy-Secretary' && accident.barangay !== user.barangay) {
      return NextResponse.json(
        { error: 'Forbidden: No access to this accident' },
        { status: 403 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Accident deleted successfully',
      accidentId: id,
    });
  } catch (error) {
    console.error('DELETE /api/accidents/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete accident' },
      { status: 500 }
    );
  }
}
