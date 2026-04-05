/**
 * app/api/maps/settings/default-center/route.js
 *
 * Default map center management API
 * GET: Fetch default center
 * POST: Set new default center (admin only)
 *
 * Firestore structure:
 * settings/
 *   mapCenter/
 *     - lat (number)
 *     - lng (number)
 *     - updatedAt (timestamp) - optional
 *     - updatedBy (string) - optional, user ID
 */

import { adminDb } from '@/lib/firebaseAdmin';
import { checkAuth } from '@/lib/auth/permissions';
import { NextResponse } from 'next/server';

/**
 * GET /api/maps/settings/default-center
 * Fetch default map center - accessible to all authenticated users
 */
export async function GET(request) {
    try {
        const docRef = adminDb.collection('settings').doc('mapCenter');
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            // Return default center if none set
            return NextResponse.json({
                lat: 9.941975,
                lng: 124.033194,
                isDefault: true,
            });
        }

        const data = docSnap.data();
        return NextResponse.json({
            lat: data.lat || 9.941975,
            lng: data.lng || 124.033194,
            isDefault: false,
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy,
        });
    } catch (error) {
        console.error('Error fetching default center:', error);
        return NextResponse.json(
            { error: 'Failed to fetch default center', type: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/maps/settings/default-center
 * Set new default map center - admin only
 */
export async function POST(request) {
    try {
        // Verify authentication
        const user = await checkAuth();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check admin role
        if (user.role !== 'MDRRMC-Admin') {
            return NextResponse.json(
                { error: 'Only MDRRMC-Admin can set default center' },
                { status: 403 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { lat, lng } = body;

        // Validate coordinates
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            return NextResponse.json(
                { error: 'Invalid coordinates: lat and lng must be numbers' },
                { status: 400 }
            );
        }

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return NextResponse.json(
                { error: 'Coordinates out of valid range' },
                { status: 400 }
            );
        }

        // Save to Firestore
        const now = new Date();
        await adminDb.collection('settings').doc('mapCenter').set({
            lat,
            lng,
            updatedAt: now,
            updatedBy: user.uid,
        });

        return NextResponse.json({
            success: true,
            message: 'Default center updated successfully',
            data: {
                lat,
                lng,
                updatedAt: now,
                updatedBy: user.uid,
            },
        });
    } catch (error) {
        console.error('Error setting default center:', error);
        return NextResponse.json(
            { error: 'Failed to set default center', type: error.message },
            { status: 500 }
        );
    }
}
