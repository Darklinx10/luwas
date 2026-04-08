/**
 * app/api/maps/boundary/route.js
 *
 * Boundary GeoJSON API endpoint
 * GET: Fetch boundary from Firestore for authenticated users
 * POST: Upload new boundary (admin only)
 *
 * Firestore structure:
 * mapSettings/config (document)
 *   - boundary (field with boundary data)
 *     - features (int64) - Number of features in GeoJSON
 *     - name (string) - Original filename
 *     - uploadedAt (timestamp)
 *     - updatedAt (timestamp)
 *     - updatedBy (string) - User ID who uploaded
 *     - geojsonData (string) - Stringified GeoJSON to avoid nested arrays
 */

import { adminDb } from '@/lib/firebaseAdmin';
import { checkAuth } from '@/lib/auth/permissions';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const user = await checkAuth();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
        console.log('🗺️ GET /api/maps/boundary called');

        // Fetch boundary from Firestore: mapSettings/config
        const docRef = adminDb.collection('mapSettings').doc('config');
        const docSnap = await docRef.get();

        console.log('📦 Config doc exists:', docSnap.exists);

        // Return empty boundary if config doc doesn't exist
        if (!docSnap.exists) {
            console.log('⚠️ Config document does not exist - returning empty boundary');
            return NextResponse.json({
                features: 0,
                name: '',
                uploadedAt: null,
                updatedAt: null,
                updatedBy: '',
                geojson: null,
            });
        }

        const data = docSnap.data();
        const boundaryData = data.boundary;

        console.log('📦 Boundary data exists:', !!boundaryData);

        // Return empty boundary if boundary field doesn't exist
        if (!boundaryData) {
            console.log('⚠️ Boundary field does not exist - returning empty boundary');
            return NextResponse.json({
                features: 0,
                name: '',
                uploadedAt: null,
                updatedAt: null,
                updatedBy: '',
                geojson: null,
            });
        }

        // Parse stringified GeoJSON
        let geojsonData = null;
        try {
            geojsonData = typeof boundaryData.geojsonData === 'string'
                ? JSON.parse(boundaryData.geojsonData)
                : boundaryData.geojsonData;
            console.log('✅ Parsed GeoJSON, features:', geojsonData?.features?.length || 0);
        } catch (e) {
            console.error('❌ Error parsing GeoJSON:', e);
            geojsonData = null;
        }

        return NextResponse.json({
            features: boundaryData.features || 0,
            name: boundaryData.name || '',
            uploadedAt: boundaryData.uploadedAt,
            updatedAt: boundaryData.updatedAt,
            updatedBy: boundaryData.updatedBy || '',
            geojson: geojsonData,
        });
    } catch (error) {
        console.error('❌ Error fetching boundary:', error);
        return NextResponse.json(
            { error: 'Failed to fetch boundary', type: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        // Verify authentication and admin role
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
                { error: 'Only MDRRMC-Admin can upload boundaries' },
                { status: 403 }
            );
        }

        // Parse multipart form data
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        if (!file.name.endsWith('.geojson')) {
            return NextResponse.json(
                { error: 'File must be a .geojson file' },
                { status: 400 }
            );
        }

        // Read and parse file
        const text = await file.text();
        let geojsonData;

        try {
            geojsonData = JSON.parse(text);
        } catch (e) {
            return NextResponse.json(
                { error: 'Invalid JSON in GeoJSON file' },
                { status: 400 }
            );
        }

        // Validate GeoJSON structure
        if (!geojsonData.type || (geojsonData.type !== 'FeatureCollection' && geojsonData.type !== 'Feature')) {
            return NextResponse.json(
                { error: 'Invalid GeoJSON structure' },
                { status: 400 }
            );
        }

        // Save boundary to Firestore: mapSettings/config - boundary field
        const now = new Date();
        const docRef = adminDb.collection('mapSettings').doc('config');

        // Use set with merge to create doc if it doesn't exist while preserving other fields
        await docRef.set({
            boundary: {
                features: geojsonData.features?.length || 0,
                name: file.name,
                uploadedAt: now,
                updatedAt: now,
                updatedBy: user.uid,
                geojsonData: JSON.stringify(geojsonData), // Stringify to avoid nested arrays
            },
        }, { merge: true });

        return NextResponse.json({
            success: true,
            message: 'Boundary uploaded successfully',
            data: {
                features: geojsonData.features?.length || 0,
                name: file.name,
                uploadedAt: now,
                updatedAt: now,
                updatedBy: user.uid,
            },
        });
    } catch (error) {
        console.error('Error uploading boundary:', error);
        return NextResponse.json(
            { error: 'Failed to upload boundary', type: error.message },
            { status: 500 }
        );
    }
}
