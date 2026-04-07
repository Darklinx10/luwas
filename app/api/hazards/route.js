/**
 * app/api/hazards/route.js
 *
 * Protected hazard data API endpoint
 * GET: Fetch hazards by type for authenticated LUWAS users
 *
 * Firestore structure (Firestore-only, no Cloud Storage):
 * hazards/
 *   [hazardType]/
 *     hazardInfo/
 *       [infoDoc]/
 *         - type (string)
 *         - description (string)
 *         - geojsonData (string) - Stringified GeoJSON FeatureCollection
 *         - features (number) - Count of features
 *         - createdAt (timestamp)
 *         - legendProp (object) - { key, type }
 *         - colorSettings (object)
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSessionUser } from '@/lib/auth/getSessionUser';

export async function GET(request) {
    try {
        const user = await getSessionUser(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized: Authentication required' },
                { status: 401 }
            );
        }

        if (!['Brgy-Secretary', 'MDRRMC-Personnel', 'MDRRMC-Admin'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Forbidden: Hazard access required' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const hazardType = searchParams.get('type');

        if (!hazardType) {
            return NextResponse.json(
                { error: 'Hazard type is required' },
                { status: 400 }
            );
        }

        // Fetch hazard info documents
        const infoSnapshot = await adminDb
            .collection('hazards')
            .doc(hazardType)
            .collection('hazardInfo')
            .get();

        if (infoSnapshot.empty) {
            return NextResponse.json({
                features: [],
                legendProp: null,
                colorSettings: {},
            });
        }

        // Fetch hazard info documents and parse GeoJSON directly
        const hazardsData = await Promise.all(
            infoSnapshot.docs.map(async (infoDoc) => {
                const infoData = infoDoc.data();
                let features = [];
                let geojsonData = null;

                // Parse stringified GeoJSON from hazardInfo (now stored directly, not in hazardFiles)
                if (infoData.geojsonData) {
                    try {
                        geojsonData = JSON.parse(infoData.geojsonData);
                        features = geojsonData.features || [];
                    } catch (e) {
                        console.error(`Error parsing GeoJSON for ${hazardType}:`, e);
                        features = [];
                    }
                }

                return {
                    id: infoDoc.id,
                    type: infoData.type || hazardType,
                    description: infoData.description || '',
                    createdAt: infoData.createdAt || null,
                    legendProp: infoData.legendProp || null,
                    colorSettings: infoData.colorSettings || {},
                    features,
                };
            })
        );

        // Merge all features if multiple hazard info docs exist
        const merged = hazardsData.reduce(
            (acc, item) => ({
                ...item,
                features: [...(acc.features || []), ...(item.features || [])],
            }),
            { features: [] }
        );

        return NextResponse.json({
            type: hazardType,
            features: merged.features || [],
            legendProp: merged.legendProp || null,
            colorSettings: merged.colorSettings || {},
            createdAt: merged.createdAt || null,
        });
    } catch (error) {
        console.error('Error fetching hazards:', error);
        return NextResponse.json(
            { error: 'Failed to fetch hazards', type: error.message },
            { status: 500 }
        );
    }
}
