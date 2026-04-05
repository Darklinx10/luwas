'use client';

import { db } from '@/lib/firebaseConfig';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    deleteDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { reprojectGeoJSON } from '@/utils/geoJsonProjection';
import { hazardTypes } from '@/utils/hazardTypes';

/**
 * Fetch all hazards grouped by type
 * @returns {Promise<Array>}
 */
export const fetchHazards = async () => {
    const hazardsByType = await Promise.all(
        hazardTypes.map(async (hazardType) => {
            const infoSnap = await getDocs(collection(db, 'hazards', hazardType, 'hazardInfo'));
            return infoSnap.docs.map((infoDoc) => {
                const infoData = infoDoc.data();
                return {
                    id: infoDoc.id,
                    type: infoData.type || hazardType,
                    description: infoData.description || '',
                    createdAt: infoData.createdAt || null,
                    legendProp: infoData.legendProp || null,
                    colorSettings: infoData.colorSettings || {},
                    features: infoData.features || 0,
                };
            });
        })
    );

    return hazardsByType.flat();
};

/**
 * Delete a hazard
 * @param {Object} hazard
 * @returns {Promise<void>}
 */
export const deleteHazard = async (hazard) => {
    // Delete hazard info document (which now contains the GeoJSON data)
    await deleteDoc(doc(db, 'hazards', hazard.type, 'hazardInfo', hazard.id));
};

/**
 * Preview hazard: fetch GeoJSON + legend/color
 * @param {Object} hazard
 * @returns {Promise<Object>} - hazard with geojson, legendProp, colorSettings
 */
export const previewHazard = async (hazard) => {
    const infoSnap = await getDoc(doc(db, 'hazards', hazard.type, 'hazardInfo', hazard.id));

    if (!infoSnap.exists()) {
        throw new Error('Hazard not found.');
    }

    const infoData = infoSnap.data();
    if (!infoData?.geojsonData) {
        throw new Error('GeoJSON data missing.');
    }

    let geojsonData;
    try {
        geojsonData = JSON.parse(infoData.geojsonData);
    } catch {
        throw new Error('Invalid GeoJSON format');
    }

    return {
        ...hazard,
        geojson: geojsonData,
        legendProp: infoData?.legendProp || null,
        colorSettings: infoData?.colorSettings || {},
    };
};

/**
 * Upload and save a new hazard via API (server-side)
 * @param {Object} params
 * @param {File} params.geojsonFile
 * @param {string} params.hazardType
 * @param {string} params.description
 * @param {Object} [params.legendProp]
 * @param {Object} [params.colorSettings]
 * @returns {Promise<void>}
 */
export const uploadHazard = async ({ geojsonFile, hazardType, description, legendProp, colorSettings }) => {
    if (!hazardType || !description || !geojsonFile) throw new Error('Missing required fields');
    if (geojsonFile.size > 10 * 1024 * 1024) throw new Error('File size exceeds 10MB limit');

    const content = await geojsonFile.text();
    const geojsonData = JSON.parse(content);

    // Validate GeoJSON
    if (!geojsonData.type || (geojsonData.type !== 'FeatureCollection' && geojsonData.type !== 'Feature')) {
        throw new Error('GeoJSON must be a Feature or FeatureCollection');
    }
    if (geojsonData.type === 'FeatureCollection' && !Array.isArray(geojsonData.features)) {
        throw new Error('FeatureCollection must have a features array');
    }

    const geojson = reprojectGeoJSON(geojsonData);

    // Save hazard info directly to Firestore (no Cloud Storage)
    await addDoc(collection(db, 'hazards', hazardType, 'hazardInfo'), {
        type: hazardType,
        description,
        geojsonData: JSON.stringify(geojson), // Stringified to avoid nested arrays
        features: geojson.features?.length || 0,
        legendProp: legendProp || null,
        colorSettings: colorSettings || {},
        createdAt: serverTimestamp(),
    });
};
