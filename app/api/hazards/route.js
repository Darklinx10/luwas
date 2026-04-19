/**
 * app/api/hazards/route.js
 *
 * Protected hazard data API endpoint
 *
 * Supported operations:
 * - GET /api/hazards
 *   Returns hazard summaries for the admin hazard table
 * - GET /api/hazards?type={hazardType}
 *   Returns merged features for a hazard type (used by map/report consumers)
 * - GET /api/hazards?type={hazardType}&id={hazardId}
 *   Returns a single hazard record with parsed GeoJSON for preview
 * - POST /api/hazards
 *   Creates a hazard record (admin only)
 * - DELETE /api/hazards?type={hazardType}&id={hazardId}
 *   Deletes a hazard record (admin only)
 *
 * Firestore structure:
 * hazards/
 *   [hazardType]/
 *     hazardInfo/
 *       [infoDoc]/
 *         - type (string)
 *         - description (string)
 *         - geojsonData (string)
 *         - features (number)
 *         - createdAt (timestamp)
 *         - legendProp (object)
 *         - colorSettings (object)
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import { hazardTypes } from '@/utils/hazardTypes';
import { reprojectGeoJSON } from '@/utils/geoJsonProjection';

const ALLOWED_HAZARD_ROLES = [
  'Brgy-Secretary',
  'MDRRMC-Personnel',
  'MDRRMC-Admin',
];

const MAX_GEOJSON_SIZE = 10 * 1024 * 1024;

const normalizeTimestamp = (value) => {
  if (!value) return null;

  if (typeof value.seconds === 'number') {
    return {
      seconds: value.seconds,
      nanoseconds: value.nanoseconds || 0,
    };
  }

  if (typeof value._seconds === 'number') {
    return {
      seconds: value._seconds,
      nanoseconds: value._nanoseconds || 0,
    };
  }

  if (value instanceof Date) {
    const milliseconds = value.getTime();
    return {
      seconds: Math.floor(milliseconds / 1000),
      nanoseconds: (milliseconds % 1000) * 1000000,
    };
  }

  return null;
};

const getHazardCollection = (hazardType) =>
  adminDb.collection('hazards').doc(hazardType).collection('hazardInfo');

const getHazardDocument = (hazardType) =>
  adminDb.collection('hazards').doc(hazardType);

const isValidHazardType = (hazardType) =>
  typeof hazardType === 'string' && hazardTypes.includes(hazardType);

const getFeatureCount = (geojsonData) => {
  if (!geojsonData) return 0;
  if (geojsonData.type === 'FeatureCollection') {
    return geojsonData.features?.length || 0;
  }
  if (geojsonData.type === 'Feature') {
    return 1;
  }
  return 0;
};

const parseOptionalJson = (value, fallback) => {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    throw new Error('Invalid JSON payload');
  }
};

const parseStoredGeoJSON = (value) => {
  if (!value) return null;

  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    throw new Error('Invalid GeoJSON format');
  }
};

const validateGeoJSON = (geojsonData) => {
  if (
    !geojsonData?.type ||
    (geojsonData.type !== 'FeatureCollection' && geojsonData.type !== 'Feature')
  ) {
    throw new Error('GeoJSON must be a Feature or FeatureCollection');
  }

  if (
    geojsonData.type === 'FeatureCollection' &&
    !Array.isArray(geojsonData.features)
  ) {
    throw new Error('FeatureCollection must have a features array');
  }
};

const requireHazardUser = async () => {
  const user = await getSessionUser();

  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      ),
    };
  }

  if (!ALLOWED_HAZARD_ROLES.includes(user.role)) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: Hazard access required' },
        { status: 403 }
      ),
    };
  }

  return { user };
};

const requireHazardAdmin = async () => {
  const result = await requireHazardUser();

  if (result.error) {
    return result;
  }

  if (result.user.role !== 'MDRRMC-Admin') {
    return {
      error: NextResponse.json(
        { error: 'Only MDRRMC-Admin can modify hazards' },
        { status: 403 }
      ),
    };
  }

  return result;
};

const buildHazardSummary = (hazardType, infoDoc) => {
  const infoData = infoDoc.data() || {};

  return {
    id: infoDoc.id,
    type: infoData.type || hazardType,
    description: infoData.description || '',
    createdAt: normalizeTimestamp(infoData.createdAt),
    legendProp: infoData.legendProp || null,
    colorSettings: infoData.colorSettings || {},
    features: infoData.features || 0,
  };
};

const getTimestampMilliseconds = (value) => {
  if (!value) return 0;

  if (typeof value.toMillis === 'function') {
    return value.toMillis();
  }

  if (typeof value.seconds === 'number') {
    return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1000000);
  }

  if (typeof value._seconds === 'number') {
    return value._seconds * 1000 + Math.floor((value._nanoseconds || 0) / 1000000);
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return 0;
};

const writeHazardTypeMetadata = async (hazardType, infoDocs = []) => {
  let layerCount = 0;
  let totalFeatures = 0;
  let latestLayer = null;
  let latestLayerMilliseconds = 0;

  infoDocs.forEach((infoDoc) => {
    const data = infoDoc.data() || {};
    const featureCount = Number(data.features || 0);
    const layerMilliseconds = getTimestampMilliseconds(data.createdAt);

    layerCount += 1;
    totalFeatures += Number.isFinite(featureCount) ? featureCount : 0;

    if (layerMilliseconds >= latestLayerMilliseconds) {
      latestLayerMilliseconds = layerMilliseconds;
      latestLayer = {
        id: infoDoc.id,
        data,
      };
    }
  });

  await getHazardDocument(hazardType).set(
    {
      type: hazardType,
      layerCount,
      totalFeatures,
      latestLayerId: latestLayer?.id || '',
      latestDescription: latestLayer?.data?.description || '',
      latestCreatedAt: latestLayerMilliseconds
        ? new Date(latestLayerMilliseconds)
        : null,
      updatedAt: new Date(),
    },
    { merge: true }
  );
};

const refreshHazardTypeMetadata = async (hazardType) => {
  const infoSnapshot = await getHazardCollection(hazardType).get();
  await writeHazardTypeMetadata(hazardType, infoSnapshot.docs);
};

const ensureHazardTypeMetadata = async (hazardType, infoDocs = []) => {
  if (infoDocs.length === 0) {
    return;
  }

  const hazardDoc = await getHazardDocument(hazardType).get();
  const metadata = hazardDoc.exists ? hazardDoc.data() || {} : {};

  if (
    metadata.type &&
    typeof metadata.layerCount === 'number' &&
    typeof metadata.totalFeatures === 'number'
  ) {
    return;
  }

  await writeHazardTypeMetadata(hazardType, infoDocs);
};

const getHazardSummaries = async () => {
  const hazardsByType = await Promise.all(
    hazardTypes.map(async (hazardType) => {
      const infoSnapshot = await getHazardCollection(hazardType).get();

      await ensureHazardTypeMetadata(hazardType, infoSnapshot.docs);

      return infoSnapshot.docs.map((infoDoc) =>
        buildHazardSummary(hazardType, infoDoc)
      );
    })
  );

  return hazardsByType.flat();
};

const getMergedHazardType = async (hazardType) => {
  const infoSnapshot = await getHazardCollection(hazardType).get();

  if (infoSnapshot.empty) {
    return {
      type: hazardType,
      description: '',
      features: [],
      legendProp: null,
      colorSettings: {},
      createdAt: null,
    };
  }

  const hazardsData = infoSnapshot.docs.map((infoDoc) => {
    const infoData = infoDoc.data() || {};
    let geojsonData = null;
    let features = [];

    if (infoData.geojsonData) {
      try {
        geojsonData = parseStoredGeoJSON(infoData.geojsonData);
        features = geojsonData?.features || [];
      } catch (error) {
        console.error(`Error parsing GeoJSON for ${hazardType}:`, error);
      }
    }

    return {
      id: infoDoc.id,
      type: infoData.type || hazardType,
      description: infoData.description || '',
      createdAt: normalizeTimestamp(infoData.createdAt),
      legendProp: infoData.legendProp || null,
      colorSettings: infoData.colorSettings || {},
      features,
    };
  });

  const merged = hazardsData.reduce(
    (acc, item) => ({
      ...item,
      description: acc.description || item.description,
      createdAt: acc.createdAt || item.createdAt,
      legendProp: acc.legendProp || item.legendProp,
      colorSettings:
        Object.keys(acc.colorSettings || {}).length > 0
          ? acc.colorSettings
          : item.colorSettings || {},
      features: [...(acc.features || []), ...(item.features || [])],
    }),
    { description: '', createdAt: null, legendProp: null, colorSettings: {}, features: [] }
  );

  return {
    type: hazardType,
    description: merged.description || '',
    features: merged.features || [],
    legendProp: merged.legendProp || null,
    colorSettings: merged.colorSettings || {},
    createdAt: normalizeTimestamp(merged.createdAt),
  };
};

const getHazardPreview = async (hazardType, hazardId) => {
  const infoDoc = await getHazardCollection(hazardType).doc(hazardId).get();

  if (!infoDoc.exists) {
    return null;
  }

  const infoData = infoDoc.data() || {};
  const geojson = parseStoredGeoJSON(infoData.geojsonData);

  return {
    id: infoDoc.id,
    type: infoData.type || hazardType,
    description: infoData.description || '',
    createdAt: normalizeTimestamp(infoData.createdAt),
    legendProp: infoData.legendProp || null,
    colorSettings: infoData.colorSettings || {},
    features: infoData.features || getFeatureCount(geojson),
    geojson,
  };
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const hazardType = searchParams.get('type');
    const hazardId = searchParams.get('id');

    if (!hazardType) {
      const auth = await requireHazardAdmin();
      if (auth.error) {
        return auth.error;
      }

      const hazards = await getHazardSummaries();
      return NextResponse.json({ hazards });
    }

    const auth = hazardId
      ? await requireHazardAdmin()
      : await requireHazardUser();
    if (auth.error) {
      return auth.error;
    }

    if (!isValidHazardType(hazardType)) {
      return NextResponse.json(
        { error: 'Invalid hazard type' },
        { status: 400 }
      );
    }

    if (hazardId) {
      const hazard = await getHazardPreview(hazardType, hazardId);

      if (!hazard) {
        return NextResponse.json(
          { error: 'Hazard not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ hazard });
    }

    const mergedHazard = await getMergedHazardType(hazardType);
    return NextResponse.json(mergedHazard);
  } catch (error) {
    console.error('Error fetching hazards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hazards', type: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = await requireHazardAdmin();
    if (auth.error) {
      return auth.error;
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const hazardType = formData.get('hazardType');
    const description = formData.get('description');
    let legendProp;
    let colorSettings;

    try {
      legendProp = parseOptionalJson(formData.get('legendProp'), null);
      colorSettings = parseOptionalJson(formData.get('colorSettings'), {});
    } catch (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'GeoJSON file is required' },
        { status: 400 }
      );
    }

    if (!isValidHazardType(hazardType)) {
      return NextResponse.json(
        { error: 'Invalid hazard type' },
        { status: 400 }
      );
    }

    if (!description || !String(description).trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (file.size > MAX_GEOJSON_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    const content = await file.text();
    let geojsonData;

    try {
      geojsonData = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: 'Invalid GeoJSON format' },
        { status: 400 }
      );
    }

    try {
      validateGeoJSON(geojsonData);
    } catch (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const normalizedGeoJSON = reprojectGeoJSON(geojsonData);
    const featureCount = getFeatureCount(normalizedGeoJSON);

    const docRef = await getHazardCollection(hazardType).add({
      type: hazardType,
      description: String(description).trim(),
      geojsonData: JSON.stringify(normalizedGeoJSON),
      features: featureCount,
      legendProp: legendProp || null,
      colorSettings: colorSettings || {},
      createdAt: new Date(),
    });

    await refreshHazardTypeMetadata(hazardType);

    return NextResponse.json(
      {
        success: true,
        hazard: {
          id: docRef.id,
          type: hazardType,
          description: String(description).trim(),
          createdAt: normalizeTimestamp(new Date()),
          legendProp: legendProp || null,
          colorSettings: colorSettings || {},
          features: featureCount,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating hazard:', error);
    return NextResponse.json(
      { error: 'Failed to create hazard', type: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireHazardAdmin();
    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const hazardType = searchParams.get('type');
    const hazardId = searchParams.get('id');

    if (!isValidHazardType(hazardType)) {
      return NextResponse.json(
        { error: 'Invalid hazard type' },
        { status: 400 }
      );
    }

    if (!hazardId) {
      return NextResponse.json(
        { error: 'Hazard id is required' },
        { status: 400 }
      );
    }

    const docRef = getHazardCollection(hazardType).doc(hazardId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Hazard not found' },
        { status: 404 }
      );
    }

    await docRef.delete();
    await refreshHazardTypeMetadata(hazardType);

    return NextResponse.json({
      success: true,
      deleted: {
        id: hazardId,
        type: hazardType,
      },
    });
  } catch (error) {
    console.error('Error deleting hazard:', error);
    return NextResponse.json(
      { error: 'Failed to delete hazard', type: error.message },
      { status: 500 }
    );
  }
}
