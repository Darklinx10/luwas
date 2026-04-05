/**
 * app/api/accidents/route.js
 * 
 * GET /api/accidents - Fetch all accidents for map overlay (all roles)
 * POST /api/accidents - Create new accident record (MDRRMC-Personnel + Admin)
 * 
 * GET returns: { success, accidents: [...], count: number }
 * POST returns: { success, accidentId, accident: {...} } or error with 401/403/500
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import { adminDb } from '@/lib/firebaseAdmin';
import admin from 'firebase-admin';
import { logFirestoreError, analyzeFirestoreError } from '@/lib/api/firestoreErrorHandler';

/**
 * ✅ Helper: Serialize Firestore Timestamp objects to ISO strings
 * Firestore Timestamps have {_seconds, _nanoseconds} structure
 * which cannot be rendered in React
 */
function serializeTimestamps(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    if (obj._seconds !== undefined && obj._nanoseconds !== undefined) {
        // Firestore Timestamp - convert to ISO string
        return new Date(obj._seconds * 1000 + obj._nanoseconds / 1000000).toISOString();
    }

    if (Array.isArray(obj)) {
        return obj.map(serializeTimestamps);
    }

    if (obj instanceof Date) {
        return obj.toISOString();
    }

    // Recursively serialize nested objects
    const serialized = {};
    for (const key in obj) {
        serialized[key] = serializeTimestamps(obj[key]);
    }
    return serialized;
}

export async function GET(request) {
    console.log('🚨 GET /api/accidents called');

    try {
        // Verify authentication
        const user = await getSessionUser(request);
        if (!user) {
            console.log('⛔ Unauthorized: No session');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // All authenticated roles can VIEW accidents
        console.log(`✅ User authenticated - role: ${user.role}`);

        // If Secretary, filter to their barangay
        let query = adminDb.collection('accidents');
        if (user.role === 'Brgy-Secretary' && user.barangay) {
            query = query.where('barangay', '==', user.barangay);
            console.log(`🏘️ Secretary filter - barangay: ${user.barangay}`);
        }

        const snapshot = await query.get();
        console.log(`📍 Fetched ${snapshot.size} accidents`);

        // ✅ Serialize Firestore Timestamps before sending to client
        const accidents = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...serializeTimestamps(data),
            };
        });

        return NextResponse.json({
            success: true,
            accidents,
            count: accidents.length,
        });
    } catch (queryError) {
        // Intelligent error handling for Firestore composite index errors
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

        console.error('❌ GET /api/accidents error:', queryError);
        return NextResponse.json(
            { error: queryError.message || 'Failed to fetch accidents' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    console.log('➕ POST /api/accidents called');

    try {
        // Verify authentication
        const user = await getSessionUser();
        if (!user) {
            console.log('⛔ Unauthorized: No session');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Only MDRRMC-Personnel and Admin can CREATE accidents
        if (!['MDRRMC-Personnel', 'MDRRMC-Admin'].includes(user.role)) {
            console.log(`⛔ Forbidden: ${user.role} cannot create accidents`);
            return NextResponse.json(
                { error: 'Forbidden: Only MDRRMC personnel can create accidents' },
                { status: 403 }
            );
        }

        console.log(`✅ User authorized to create - role: ${user.role}`);

        // Parse request body
        const accidentData = await request.json();

        // Validate required fields
        if (!accidentData.lat || !accidentData.lng) {
            console.log('⛔ Missing required fields');
            return NextResponse.json(
                { error: 'Missing required fields: lat, lng' },
                { status: 400 }
            );
        }

        // ✅ For Secretary, use their barangay; for Admin, use provided barangay or empty
        let barangay = accidentData.barangay || '';
        if (user.role === 'Brgy-Secretary') {
            barangay = user.barangay || '';
        }

        // Create accident document
        const newAccident = {
            ...accidentData,
            barangay, // ✅ Use determined barangay
            createdBy: user.uid,
            createdByRole: user.role,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await adminDb.collection('accidents').add(newAccident);
        console.log(`✅ Created accident: ${docRef.id}`);

        return NextResponse.json(
            {
                success: true,
                accidentId: docRef.id,
                accident: { id: docRef.id, ...newAccident },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('❌ POST /api/accidents error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create accident' },
            { status: 500 }
        );
    }
}
