'use client';

import { db, storage } from '@/lib/firebaseConfig';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
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
      return await Promise.all(
        infoSnap.docs.map(async (infoDoc) => {
          const infoData = infoDoc.data();
          let fileUrl = null;

          if (infoData.fileId) {
            const fileSnap = await getDoc(doc(db, 'hazards', hazardType, 'hazardFiles', infoData.fileId));
            if (fileSnap.exists()) fileUrl = fileSnap.data()?.fileUrl || null;
          }

          return {
            id: infoDoc.id,
            type: infoData.type || hazardType,
            description: infoData.description || '',
            createdAt: infoData.createdAt || null,
            fileId: infoData.fileId || null,
            fileUrl,
            legendProp: infoData.legendProp || null,
            colorSettings: infoData.colorSettings || {},
          };
        })
      );
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
  await deleteDoc(doc(db, 'hazards', hazard.type, 'hazardInfo', hazard.id));
  if (hazard.fileId) {
    await deleteDoc(doc(db, 'hazards', hazard.type, 'hazardFiles', hazard.fileId));
  }
};

/**
 * Preview hazard: fetch GeoJSON + legend/color
 * @param {Object} hazard
 * @returns {Promise<Object>} - hazard with geojson, legendProp, colorSettings
 */
export const previewHazard = async (hazard) => {
  if (!hazard.fileId) throw new Error('No hazard file linked.');

  const fileSnap = await getDoc(doc(db, 'hazards', hazard.type, 'hazardFiles', hazard.fileId));
  if (!fileSnap.exists()) throw new Error('Hazard file not found.');

  const fileData = fileSnap.data();
  if (!fileData?.geojsonString) throw new Error('GeoJSON data missing.');

  let geojsonData;
  try {
    geojsonData = JSON.parse(fileData.geojsonString);
  } catch {
    throw new Error('Invalid GeoJSON format');
  }

  const infoSnap = await getDoc(doc(db, 'hazards', hazard.type, 'hazardInfo', hazard.id));
  const infoData = infoSnap.exists() ? infoSnap.data() : {};

  return {
    ...hazard,
    geojson: geojsonData,
    legendProp: infoData?.legendProp || null,
    colorSettings: infoData?.colorSettings || {},
  };
};

/**
 * Upload and save a new hazard
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

  // Prepare safe filename
  const safeFileName = geojsonFile.name.replace(/[\s\/\\:*?"<>|]+/g, '_').replace(/\.geojson$/i, '');
  const storagePath = `hazards/${hazardType}/${Date.now()}-${safeFileName}.geojson`;
  const storageRef = ref(storage, storagePath);

  // Upload
  await uploadBytes(storageRef, new Blob([JSON.stringify(geojson)], { type: 'application/geo+json' }));
  const downloadURL = await getDownloadURL(storageRef);

  // Save file metadata
  const hazardFileRef = await addDoc(collection(db, 'hazards', hazardType, 'hazardFiles'), {
    name: geojsonFile.name,
    geojsonString: JSON.stringify(geojson),
    fileUrl: downloadURL,
    createdAt: serverTimestamp(),
  });

  // Save hazard info
  await addDoc(collection(db, 'hazards', hazardType, 'hazardInfo'), {
    fileId: hazardFileRef.id,
    type: hazardType,
    description,
    legendProp: legendProp || null,
    colorSettings: colorSettings || {},
    createdAt: serverTimestamp(),
  });
};
