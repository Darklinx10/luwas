/**
 * app/api/accidents/route.js
 *
 * GET /api/accidents - Fetch all accidents for map/report views
 * POST /api/accidents - Create a new accident record
 */

import admin from 'firebase-admin';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import { analyzeFirestoreError, logFirestoreError } from '@/lib/api/firestoreErrorHandler';

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

export async function GET(request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = adminDb.collection('accidents');
    if (user.role === 'Brgy-Secretary' && user.barangay) {
      query = query.where('barangay', '==', user.barangay);
    }

    const snapshot = await query.get();
    const accidents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...serializeTimestamps(doc.data()),
    }));

    return NextResponse.json({
      success: true,
      accidents,
      count: accidents.length,
    });
  } catch (queryError) {
    if (queryError?.code === 9 || queryError?.message?.includes('FAILED_PRECONDITION')) {
      const queryMetadata = {
        collection: 'accidents',
        where: [],
        orderBy: [],
        pagination: 'offset',
      };

      logFirestoreError(queryError, queryMetadata);
      const analysis = analyzeFirestoreError(queryError, queryMetadata);

      return NextResponse.json(
        {
          error: 'Firestore composite index required',
          errorCode: queryError.code,
          isIndexError: true,
          consoleLink: analysis.indexUrl,
          explanation: analysis.explanation,
          message: 'An index is required for this query.',
        },
        { status: 503 }
      );
    }

    console.error('GET /api/accidents error:', queryError);
    return NextResponse.json(
      { error: queryError.message || 'Failed to fetch accidents' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['MDRRMC-Personnel', 'MDRRMC-Admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only MDRRMC personnel can create accidents' },
        { status: 403 }
      );
    }

    const accidentData = await request.json();

    if (!accidentData.lat || !accidentData.lng) {
      return NextResponse.json(
        { error: 'Missing required fields: lat, lng' },
        { status: 400 }
      );
    }

    const barangay =
      user.role === 'Brgy-Secretary'
        ? user.barangay || ''
        : accidentData.barangay || '';

    const newAccident = {
      ...accidentData,
      barangay,
      createdBy: user.uid,
      createdByRole: user.role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('accidents').add(newAccident);
    const createdSnap = await docRef.get();

    return NextResponse.json(
      {
        success: true,
        accidentId: docRef.id,
        accident: {
          id: docRef.id,
          ...serializeTimestamps(createdSnap.data() || {}),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/accidents error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create accident' },
      { status: 500 }
    );
  }
}
