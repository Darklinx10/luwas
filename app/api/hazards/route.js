/**
 * app/api/hazards/route.js
 *
 * Public hazard data API endpoint
 * GET: Fetch hazards by type (visible to all users - admin and personnel)
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

import { adminDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
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
