/**
 * app/api/reports/affected-households/route.js
 *
 * GET /api/reports/affected-households
 * Returns household locations affected by the selected hazard layer.
 *
 * Source of truth:
 * - households collection (top-level household summaries + homes coordinates)
 * - hazards/[type]/hazardInfo documents (stored GeoJSON polygons)
 */

import { NextResponse } from 'next/server';
import * as turf from '@turf/turf';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import { compareNames } from '@/lib/utils/nameNormalizer';
import { formatHouseholdName } from '@/features/Map/utils/formatHouseholdName';
import { hazardTypes as orderedHazardTypes } from '@/utils/hazardTypes';

const AFFECTED_HOUSEHOLD_FIELDS = [
  'homes',
  'barangay',
  'sitio',
  'contactNumber',
  'headFirstName',
  'headMiddleName',
  'headLastName',
  'headSuffix',
  'headFullName',
  'totalResidents',
  'totalMale',
  'totalFemale',
  'totalPWDs',
  'totalSeniors',
];

function compareAffectedRows(a, b) {
  const nameComparison = compareNames(
    {
      firstName: a?.headFirstName,
      middleName: a?.headMiddleName,
      lastName: a?.headLastName,
      suffix: a?.headSuffix,
    },
    {
      firstName: b?.headFirstName,
      middleName: b?.headMiddleName,
      lastName: b?.headLastName,
      suffix: b?.headSuffix,
    }
  );

  if (nameComparison !== 0) {
    return nameComparison;
  }

  return String(a?.homeLabel || '').toLowerCase().localeCompare(String(b?.homeLabel || '').toLowerCase());
}

function inferLegendProp(features = []) {
  const firstFeature = features.find((feature) => feature?.properties && typeof feature.properties === 'object');
  if (!firstFeature) {
    return null;
  }

  const keys = Object.keys(firstFeature.properties);
  if (keys.length === 0) {
    return null;
  }

  const key = keys[0];
  return {
    key,
    type: typeof firstFeature.properties[key] === 'number' ? 'numeric' : 'categorical',
  };
}

function parseHazardInfo(infoDocs = []) {
  const features = [];
  let legendProp = null;

  infoDocs.forEach((doc) => {
    const data = doc.data() || {};

    if (!legendProp && data.legendProp?.key) {
      legendProp = data.legendProp;
    }

    if (!data.geojsonData) {
      return;
    }

    try {
      const geojson = JSON.parse(data.geojsonData);
      if (Array.isArray(geojson?.features)) {
        features.push(...geojson.features);
      }
    } catch (error) {
      console.error(`Failed to parse hazard GeoJSON for ${doc.ref.parent.parent?.id}:`, error);
    }
  });

  return {
    features,
    legendProp: legendProp || inferLegendProp(features),
  };
}

function findMatchedFeature(point, features = []) {
  return features.find((feature) => {
    if (!feature?.geometry?.coordinates?.length) {
      return false;
    }

    try {
      return turf.booleanPointInPolygon(point, feature);
    } catch (error) {
      return false;
    }
  });
}

export async function GET(request) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required' },
      { status: 401 }
    );
  }

  if (!['Brgy-Secretary', 'MDRRMC-Personnel'].includes(user.role)) {
    return NextResponse.json(
      { error: 'Forbidden: Report access required' },
      { status: 403 }
    );
  }

  try {
    const url = new URL(request.url);
    const requestedHazardType = String(url.searchParams.get('hazardType') || '').trim();

    const hazardRefs = await adminDb.collection('hazards').listDocuments();
    const availableHazardTypes = hazardRefs.map((docRef) => docRef.id);
    const extraHazardTypes = availableHazardTypes
      .filter((type) => !orderedHazardTypes.includes(type))
      .sort((a, b) => a.localeCompare(b));
    const hazardTypes = [
      ...orderedHazardTypes,
      ...extraHazardTypes,
    ];

    if (hazardTypes.length === 0) {
      return NextResponse.json({
        success: true,
        hazardTypes: [],
        selectedHazardType: '',
        legendProp: null,
        affectedHouseholds: [],
        count: 0,
      });
    }

    const selectedHazardType =
      requestedHazardType && hazardTypes.includes(requestedHazardType)
        ? requestedHazardType
        : '';

    if (!selectedHazardType) {
      return NextResponse.json({
        success: true,
        hazardTypes,
        selectedHazardType: '',
        legendProp: null,
        affectedHouseholds: [],
        count: 0,
      });
    }

    const hazardInfoSnap = await adminDb
      .collection('hazards')
      .doc(selectedHazardType)
      .collection('hazardInfo')
      .select('geojsonData', 'legendProp')
      .get();

    const { features, legendProp } = parseHazardInfo(hazardInfoSnap.docs);

    let householdsQuery = adminDb.collection('households');
    if (user.role === 'Brgy-Secretary') {
      householdsQuery = householdsQuery.where('barangay', '==', user.barangay);
    }
    householdsQuery = householdsQuery.select(...AFFECTED_HOUSEHOLD_FIELDS);

    const householdSnap = await householdsQuery.get();
    const affectedHouseholds = [];

    householdSnap.forEach((householdDoc) => {
      const householdId = householdDoc.id;
      const household = householdDoc.data() || {};
      const homes = Array.isArray(household.homes) ? household.homes : [];

      if (homes.length === 0) {
        return;
      }

      homes.forEach((home, index) => {
        const lat = Number(home?.latitude);
        const lng = Number(home?.longitude);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return;
        }

        const point = turf.point([lng, lat]);
        const matchedFeature = findMatchedFeature(point, features);

        if (!matchedFeature) {
          return;
        }

        const value =
          legendProp?.key && matchedFeature?.properties
            ? matchedFeature.properties[legendProp.key] ?? 'N/A'
            : undefined;

        affectedHouseholds.push({
          recordId: `affected:${householdId}:${index}`,
          householdId,
          homeIndex: index,
          homeLabel: home?.label || (index === 0 ? 'Primary Home' : `Home ${index + 1}`),
          name: formatHouseholdName({
            householdId,
            ...household,
          }),
          headFullName: formatHouseholdName({
            householdId,
            ...household,
          }),
          headFirstName: household?.headFirstName || '',
          headMiddleName: household?.headMiddleName || '',
          headLastName: household?.headLastName || '',
          headSuffix: household?.headSuffix || '',
          barangay: household?.barangay || '',
          sitio: home?.sitio || household?.sitio || '',
          contactNumber: household?.contactNumber || '',
          lat,
          lng,
          totalResidents: Number(household?.totalResidents || 0),
          totalMale: Number(household?.totalMale || 0),
          totalFemale: Number(household?.totalFemale || 0),
          totalPWDs: Number(household?.totalPWDs || 0),
          totalSeniors: Number(household?.totalSeniors || 0),
          ...(legendProp?.key ? { [legendProp.key]: value } : {}),
        });
      });
    });

    affectedHouseholds.sort(compareAffectedRows);

    return NextResponse.json({
      success: true,
      hazardTypes,
      selectedHazardType,
      legendProp,
      affectedHouseholds,
      count: affectedHouseholds.length,
    });
  } catch (error) {
    console.error('GET /api/reports/affected-households error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch affected households report' },
      { status: 500 }
    );
  }
}
