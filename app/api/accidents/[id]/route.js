/**
 * app/api/accidents/[id]/route.js
 * 
 * GET /api/accidents/[id] - Fetch single accident
 * PATCH /api/accidents/[id] - Update accident (MDRRMC-Personnel + Admin only)
 * DELETE /api/accidents/[id] - Delete accident (MDRRMC-Personnel + Admin only)
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import { adminDb } from '@/lib/firebaseAdmin';
import admin from 'firebase-admin';

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

export async function GET(request, { params }) {
    try {
        // Verify authentication
        const user = await getSessionUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;

        // Fetch accident document
        const docRef = adminDb.collection('accidents').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json(
                { error: 'Accident not found' },
                { status: 404 }
            );
        }

        const accident = docSnap.data();

        // ✅ Secretary can only view accidents in their barangay
        if (user.role === 'Brgy-Secretary' && accident.barangay !== user.barangay) {
            return NextResponse.json(
                { error: 'Forbidden: No access to this accident' },
                { status: 403 }
            );
        }

        // ✅ Serialize Firestore Timestamps before sending to client
        return NextResponse.json({
            success: true,
            accident: { id, ...serializeTimestamps(accident) },
        });
    } catch (error) {
        console.error('❌ GET /api/accidents/[id] error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch accident' },
            { status: 500 }
        );
    }
}

export async function PATCH(request, { params }) {
    try {
        // Verify authentication
        const user = await getSessionUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Only MDRRMC-Personnel and Admin can UPDATE accidents
        if (!['MDRRMC-Personnel', 'MDRRMC-Admin'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Forbidden: Only MDRRMC personnel can update accidents' },
                { status: 403 }
            );
        }

        const { id } = await params;
        const updateData = await request.json();

        // Validate update data
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

        // Add update timestamp
        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        updates.updatedBy = user.uid;

        // Update document
        const docRef = adminDb.collection('accidents').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json(
                { error: 'Accident not found' },
                { status: 404 }
            );
        }

        const accident = docSnap.data();

        // ✅ Secretary can only update accidents in their barangay
        if (user.role === 'Brgy-Secretary' && accident.barangay !== user.barangay) {
            return NextResponse.json(
                { error: 'Forbidden: No access to this accident' },
                { status: 403 }
            );
        }

        await docRef.update(updates);

        // ✅ Serialize Firestore Timestamps before sending to client
        return NextResponse.json({
            success: true,
            accident: { id, ...serializeTimestamps(accident), ...updates },
        });
    } catch (error) {
        console.error('❌ PATCH /api/accidents/[id] error:', error);
        return NextResponse.json(
            { error: 'Failed to update accident' },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        // Verify authentication
        const user = await getSessionUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Only MDRRMC-Personnel and Admin can DELETE accidents
        if (!['MDRRMC-Personnel', 'MDRRMC-Admin'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Forbidden: Only MDRRMC personnel can delete accidents' },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Fetch accident before delete for verification
        const docRef = adminDb.collection('accidents').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json(
                { error: 'Accident not found' },
                { status: 404 }
            );
        }

        const accident = docSnap.data();

        // ✅ Secretary can only delete accidents in their barangay
        if (user.role === 'Brgy-Secretary' && accident.barangay !== user.barangay) {
            return NextResponse.json(
                { error: 'Forbidden: No access to this accident' },
                { status: 403 }
            );
        }

        // Delete document
        await docRef.delete();

        return NextResponse.json({
            success: true,
            message: 'Accident deleted successfully',
            accidentId: id,
        });
    } catch (error) {
        console.error('❌ DELETE /api/accidents/[id] error:', error);
        return NextResponse.json(
            { error: 'Failed to delete accident' },
            { status: 500 }
        );
    }
}
