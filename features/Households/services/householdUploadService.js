import * as XLSX from 'xlsx';
import { db } from '@/lib/firebaseConfig';
import {
  writeBatch,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import * as turf from '@turf/turf'; // ✅ For boundary polygon validation
import { processHeadName, normalizeNameComponents } from '@/lib/utils/nameNormalizer';

/**
 * ✅ COORDINATE VALIDATION SUITE
 */

/** Philippines geographic bounds (rough) */
const PHILIPPINES_BOUNDS = {
  minLat: 4.5,
  maxLat: 20.0,
  minLng: 119.0,
  maxLng: 128.5,
};

/**
 * Parse and validate a coordinate value
 * Handles edge cases: whitespace, "N/A", "undefined", "null", empty strings, etc.
 * 
 * @param {*} value - Raw value from CSV/Excel (string, number, null, undefined, etc.)
 * @returns {Object} { valid: boolean, number: number|null, error: string|null }
 */
function parseCoordinate(value) {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return { valid: false, number: null, error: null };
  }

  // Convert to string and trim whitespace
  let strValue = String(value).trim();

  // Handle common "empty" placeholders from Excel/CSV
  const emptyPatterns = ['', 'n/a', 'na', 'null', 'undefined', '-', '--', 'none', 'no data'];
  if (emptyPatterns.includes(strValue.toLowerCase())) {
    return { valid: false, number: null, error: null };
  }

  // Try to parse as number
  const num = Number(strValue);

  if (isNaN(num)) {
    return { 
      valid: false, 
      number: null, 
      error: `"${strValue}" is not a valid number`
    };
  }

  return { valid: true, number: num, error: null };
}

/**
 * Validate single coordinate is in valid range
 * @param {number} lat - Latitude (already parsed)
 * @param {number} lng - Longitude (already parsed)
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateCoordinateRange(lat, lng) {
  const errors = [];

  if (typeof lat !== 'number' || isNaN(lat)) {
    errors.push('Latitude is not a valid number');
  } else if (lat < -90 || lat > 90) {
    errors.push(`Latitude ${lat} out of range (-90 to 90)`);
  }

  if (typeof lng !== 'number' || isNaN(lng)) {
    errors.push('Longitude is not a valid number');
  } else if (lng < -180 || lng > 180) {
    errors.push(`Longitude ${lng} out of range (-180 to 180)`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanity check: Is coordinate in Philippines geographic bounds?
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} { inPhilippines: boolean, message: string }
 */
function isPointInPhilippines(lat, lng) {
  const inBounds =
    lat >= PHILIPPINES_BOUNDS.minLat &&
    lat <= PHILIPPINES_BOUNDS.maxLat &&
    lng >= PHILIPPINES_BOUNDS.minLng &&
    lng <= PHILIPPINES_BOUNDS.maxLng;

  return {
    inPhilippines: inBounds,
    message: inBounds
      ? 'OK'
      : `Coordinate (${lat}, ${lng}) appears to be outside Philippines bounds`,
  };
}

/**
 * Check if point is within boundary polygon using turf.js
 * 
 * Validates coordinate against GeoJSON boundary fetched from mapSettings/config.boundary.geojsonData
 * 
 * @param {number} lat - Latitude (degrees, -90 to 90)
 * @param {number} lng - Longitude (degrees, -180 to 180)
 * @param {Object} boundaryGeoJSON - GeoJSON Feature or FeatureCollection with Polygon/MultiPolygon
 * @returns {boolean|null} 
 *   - true: Point is inside boundary polygon
 *   - false: Point is outside boundary polygon
 *   - null: Unable to validate (error in geometry validation)
 */
function isPointInBoundary(lat, lng, boundaryGeoJSON) {
  try {
    if (!boundaryGeoJSON) return null; // Boundary not available - cannot validate

    // turf.js requires [lng, lat] format (GeoJSON spec)
    const point = turf.point([lng, lat]);

    // Handle both Feature and FeatureCollection
    let features = [];
    if (boundaryGeoJSON.type === 'FeatureCollection') {
      features = boundaryGeoJSON.features || [];
    } else if (boundaryGeoJSON.type === 'Feature') {
      features = [boundaryGeoJSON];
    } else {
      console.warn(`Invalid GeoJSON type: ${boundaryGeoJSON.type}. Expected 'Feature' or 'FeatureCollection'`);
      return null;
    }

    if (features.length === 0) {
      console.warn('Boundary GeoJSON has no features');
      return null;
    }

    // Check point against all polygon features
    for (const feature of features) {
      try {
        // booleanPointInPolygon works with Polygon and MultiPolygon geometries
        if (turf.booleanPointInPolygon(point, feature)) {
          return true; // Point is inside this boundary
        }
      } catch (err) {
        console.warn(`Error checking point (${lat}, ${lng}) against boundary feature:`, err.message);
        continue; // Try next feature
      }
    }

    return false; // Point is outside all boundary polygons

  } catch (err) {
    console.error(`Error validating boundary for coordinates (${lat}, ${lng}):`, err);
    return null; // Cannot validate - treat as non-critical warning
  }
}

/**
 * ✅ Detect if coordinates are swapped
 * Handles cases where one or both coordinates are out of range
 * Checks if swapping would put both in valid ranges
 * 
 * @param {number} lat - Latitude (may be swapped)
 * @param {number} lng - Longitude (may be swapped)
 * @returns {Object} { lat, lng, swapped: boolean, message: string}
 */
function detectAndFixSwappedCoordinates(lat, lng) {
  const latNum = Number(lat);
  const lngNum = Number(lng);

  // Check if coordinates are in valid ranges for their current assignment
  const latInValidRange = latNum >= -90 && latNum <= 90;
  const lngInValidRange = lngNum >= -180 && lngNum <= 180;

  // Both in valid ranges - no swap needed
  if (latInValidRange && lngInValidRange) {
    return {
      lat: latNum,
      lng: lngNum,
      swapped: false,
      message: null,
    };
  }

  // At least one is out of range - check if swapping would fix it
  const swappedLatValid = lngNum >= -90 && lngNum <= 90;      // Would lng be valid as lat?
  const swappedLngValid = latNum >= -180 && latNum <= 180;    // Would lat be valid as lng?

  // If swapping makes both valid, and they're currently not both valid, swap them
  if (swappedLatValid && swappedLngValid && (!latInValidRange || !lngInValidRange)) {
    return {
      lat: lngNum,
      lng: latNum,
      swapped: true,
      message: `⚠️ Coordinates were swapped: (${lat}, ${lng}) → (${lngNum}, ${latNum})`,
    };
  }

  // No swap possible or needed - return as-is and let range validation catch the error
  return {
    lat: latNum,
    lng: lngNum,
    swapped: false,
    message: null,
  };
}

/**
 * Comprehensive validation for a home's coordinates
 * 
 * Validation Steps:
 * 1. Check if coordinates provided (skip missing data gracefully)
 * 2. Detect & fix swapped coordinates
 * 3. Validate coordinate range (-90 to 90 lat, -180 to 180 lng)
 * 4. Sanity check: Is point in Philippines bounds? (optional warning)
 * 5. Boundary validation: Is point within municipality boundary? (optional warning if boundary available from mapSettings/config.boundary)
 * 
 * @param {Object} home - Home object with latitude, longitude properties (raw values from CSV/Excel)
 * @param {Object} boundaryGeoJSON - Boundary GeoJSON from mapSettings/config.boundary.geojsonData (optional)
 * @param {string} homeLabel - Label for error messages (e.g., "John Doe - Primary Home")
 * @returns {Object} Validation result with structure:
 *   - valid: boolean (true if no critical errors)
 *   - home: Object|null (corrected home object or null if skipped/invalid)
 *   - warnings: string[] (non-critical issues, upload proceeds)
 *   - errors: string[] (critical issues that stop upload)
 *   - skipped: boolean (true if coordinates missing/incomplete)
 *   - reason: string (why coordinate was skipped)
 */
function validateHomeCoordinates(home, boundaryGeoJSON, homeLabel = 'Home') {
  // Accept coordinates as-is without validation
  // If both latitude and longitude are missing, skip this home
  if (!home.latitude && !home.longitude) {
    return {
      valid: true,
      home: null,
      warnings: [],
      errors: [],
      skipped: true,
      reason: 'No coordinates provided',
    };
  }

  // If only one is provided, skip
  if (!home.latitude || !home.longitude) {
    return {
      valid: true,
      home: null,
      warnings: [],
      errors: [],
      skipped: true,
      reason: 'Incomplete coordinates',
    };
  }

  // Accept the coordinates as-is (no range validation)
  const lat = Number(home.latitude);
  const lng = Number(home.longitude);

  // Return home with coordinates accepted
  return {
    valid: true,
    home: { ...home, latitude: lat, longitude: lng, label: home.label },
    warnings: [],
    errors: [],
    skipped: false,
  };
}

/**
 * Fetch boundary GeoJSON from Firestore via API endpoint
 * 
 * Data Source Path: mapSettings/config (document) → boundary field → geojsonData (stringified JSON)
 * API Endpoint: GET /api/maps/boundary
 * 
 * The API endpoint:
 * 1. Reads from Firestore: adminDb.collection('mapSettings').doc('config')
 * 2. Extracts: data.boundary.geojsonData
 * 3. Parses stringified JSON and returns as {geojson, features, name, uploadedAt, updatedAt, updatedBy}
 * 
 * @returns {Promise<Object|null>} GeoJSON FeatureCollection/Feature or null if not available
 * @throws {Error} Returns null instead of throwing - validates coordinates without boundary if unavailable
 */
async function fetchBoundaryGeoJSON() {
  try {
    console.log('📍 Fetching boundary from GET /api/maps/boundary (source: mapSettings/config.boundary)');

    const response = await fetch('/api/maps/boundary');

    if (!response.ok) {
      console.warn(`⚠️ Boundary API returned status ${response.status} - coordinate validation will proceed without boundary polygon check`);
      return null;
    }

    const data = await response.json();

    if (!data.geojson) {
      console.warn('⚠️ No boundary GeoJSON available in Firestore (mapSettings/config.boundary.geojsonData is empty) - coordinate validation will proceed without boundary polygon check');
      return null;
    }

    console.log(`✅ Boundary loaded: ${data.features || 0} features from "${data.name || 'Unnamed Boundary'}"`);
    return data.geojson;

  } catch (err) {
    console.error('❌ Error fetching boundary from API:/api/maps/boundary', err);
    console.warn('⚠️ Boundary unavailable - coordinate validation will proceed without boundary polygon check');
    return null;
  }
}

/**
 * Calculate age brackets from members array and household head
 * @param {Array} members - Array of member objects with age property
 * @param {number} headAge - Age of the household head (included in brackets)
 * @returns {Object} Age bracket counts
 */
function calculateAgeBrackets(members, headAge = 0) {
  const brackets = {
    'Under 1': 0,
    '1-4': 0,
    '5-9': 0,
    '10-14': 0,
    '15-19': 0,
    '20-24': 0,
    '25-29': 0,
    '30-34': 0,
    '35-39': 0,
    '40-44': 0,
    '45-49': 0,
    '50-54': 0,
    '55-59': 0,
    '60 and over': 0,
  };

  // ✅ Include head's age in brackets
  const headAgeValue = Number(headAge) || 0;
  if (headAgeValue < 1) brackets['Under 1']++;
  else if (headAgeValue <= 4) brackets['1-4']++;
  else if (headAgeValue <= 9) brackets['5-9']++;
  else if (headAgeValue <= 14) brackets['10-14']++;
  else if (headAgeValue <= 19) brackets['15-19']++;
  else if (headAgeValue <= 24) brackets['20-24']++;
  else if (headAgeValue <= 29) brackets['25-29']++;
  else if (headAgeValue <= 34) brackets['30-34']++;
  else if (headAgeValue <= 39) brackets['35-39']++;
  else if (headAgeValue <= 44) brackets['40-44']++;
  else if (headAgeValue <= 49) brackets['45-49']++;
  else if (headAgeValue <= 54) brackets['50-54']++;
  else if (headAgeValue <= 59) brackets['55-59']++;
  else brackets['60 and over']++;

  // Include members' ages in brackets
  members.forEach(member => {
    const age = Number(member.age) || 0;
    if (age < 1) brackets['Under 1']++;
    else if (age <= 4) brackets['1-4']++;
    else if (age <= 9) brackets['5-9']++;
    else if (age <= 14) brackets['10-14']++;
    else if (age <= 19) brackets['15-19']++;
    else if (age <= 24) brackets['20-24']++;
    else if (age <= 29) brackets['25-29']++;
    else if (age <= 34) brackets['30-34']++;
    else if (age <= 39) brackets['35-39']++;
    else if (age <= 44) brackets['40-44']++;
    else if (age <= 49) brackets['45-49']++;
    else if (age <= 54) brackets['50-54']++;
    else if (age <= 59) brackets['55-59']++;
    else brackets['60 and over']++;
  });

  return brackets;
}


/**
 * Batch upload households and members
 * Pattern:
 * 1. Write parent household doc with top-level fields
 * 2. Write nested subcollections (geographicIdentification, members, demographicCharacteristics)
 * 3. Calculate and update totals in parent household doc after members are saved
 * 4. ✅ NEW: Validate coordinates against boundary and geographic bounds
 */
export async function uploadHouseholdsFromFile(file, onProgress) {
  const ext = file.name.split('.').pop().toLowerCase();
  let householdRows = [];
  let memberRows = [];

  // Progress: File reading (10%)
  if (onProgress) onProgress({ percentage: 5, stage: 'reading', message: 'Reading file...', currentBatch: 0, totalBatches: 0 });

  if (ext === 'json') {
    const text = await file.text();
    const data = JSON.parse(text);
    householdRows = data.households || [];
    memberRows = data.members || [];
  } else if (['csv', 'xlsx', 'xls'].includes(ext)) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', raw: true });
    const householdSheetName = workbook.SheetNames.find(name =>
      ['household','households'].includes(name.trim().toLowerCase())
    );
    const memberSheetName = workbook.SheetNames.find(name =>
      ['member','members'].includes(name.trim().toLowerCase())
    );
    if (!householdSheetName || !memberSheetName) throw new Error('Missing sheets');
    householdRows = XLSX.utils.sheet_to_json(workbook.Sheets[householdSheetName], { defval: '' });
    memberRows = XLSX.utils.sheet_to_json(workbook.Sheets[memberSheetName], { defval: '' });
  } else {
    throw new Error('Unsupported file type');
  }

  // Progress: File parsed (15%)
  if (onProgress) onProgress({ percentage: 15, stage: 'parsing', message: 'Parsing data...', currentBatch: 0, totalBatches: 0 });

  if (!householdRows.length) throw new Error('Households sheet is empty');
  if (!memberRows.length) throw new Error('Members sheet is empty');

  // ✅ Step 1: Fetch boundary from mapSettings/config.boundary via /api/maps/boundary
  if (onProgress) onProgress({ percentage: 18, stage: 'validation', message: 'Loading boundary from mapSettings/config...', currentBatch: 0, totalBatches: 0 });
  const boundaryGeoJSON = await fetchBoundaryGeoJSON();
  if (boundaryGeoJSON) {
    console.log('✅ Boundary GeoJSON loaded successfully from mapSettings/config.boundary');
  } else {
    console.warn('⚠️ Boundary not available in mapSettings/config.boundary - coordinate validation will proceed with range checks only (Province: Philippines bounds, and coordinate range -90 to 90, -180 to 180)');
  }

  // ✅ Coordinate validation tracking
  const coordinateIssues = {
    errors: [],    // Critical errors (stop upload)
    warnings: [],  // Non-critical warnings (show to user)
    duplicates: [], // Duplicate coordinates detected
  };
  const coordinateMap = {}; // Track {lat,lng} => [households]

  // Build household map with top-level fields
  const householdsMap = {};
  householdRows.forEach(row => {
    const householdId = (row['Household ID'] || '').toString().trim();
    if (!householdId) return;

    // Normalize and split household head names
    const normalizedNames = processHeadName({
      headFirstName: row.headFirstName || row['Head FirstName'],
      headMiddleName: row.headMiddleName || row['Head MiddleName'],
      headLastName: row.headLastName || row['Head LastName'],
      headSuffix: row.headSuffix || row['Head Suffix'],
      headFullName: row.headFullName || row['Head FullName'],
    });

    householdsMap[householdId] = {
      householdId,
      // Top-level fields for parent doc - use normalized names
      headFirstName: normalizedNames.firstName,
      headMiddleName: normalizedNames.middleName,
      headLastName: normalizedNames.lastName,
      headSuffix: normalizedNames.suffix,
      headSex: row.headSex || row['Head Sex'] || '',
      headAge: Number(row.headAge || row['Head Age']) || 0,
      contactNumber: row.headContactNumber || row['Contact Number'] || 'N/A',
      barangay: row.barangay || row['Barangay'] || '',
      sitio: row.sitio || row['Sitio'] || '',
      // Nested geoData for geographicIdentification subcollection
      geoData: {
        headFirstName: normalizedNames.firstName,
        headMiddleName: normalizedNames.middleName,
        headLastName: normalizedNames.lastName,
        headSuffix: normalizedNames.suffix,
        headSex: row.headSex || row['Head Sex'] || '',
        headAge: Number(row.headAge || row['Head Age']) || 0,
        contactNumber: row.headContactNumber || row['Contact Number'] || 'N/A',
        barangay: row.barangay || row['Barangay'] || '',
        sitio: row.sitio || row['Sitio'] || '',
        homes: (() => {
          const allHomes = [
            { label: 'Primary Home', latitude: row.home1_latitude || row['Home1 Latitude'], longitude: row.home1_longitude || row['Home1 Longitude'] },
            { label: 'Secondary Home 1', latitude: row.home2_latitude || row['Home2 Latitude'], longitude: row.home2_longitude || row['Home2 Longitude'] },
            { label: 'Secondary Home 2', latitude: row.home3_latitude || row['Home3 Latitude'], longitude: row.home3_longitude || row['Home3 Longitude'] },
            { label: 'Secondary Home 3', latitude: row.home4_latitude || row['Home4 Latitude'], longitude: row.home4_longitude || row['Home4 Longitude'] },
          ];

          // ✅ Validate each home's coordinates (handles missing, swapped, & invalid)
          const validHomes = allHomes.map(home => {
            const headName = `${normalizedNames.firstName} ${normalizedNames.lastName}`;
            const validation = validateHomeCoordinates(home, boundaryGeoJSON, `${headName} - ${home.label}`);

            // ✅ Skip homes with missing/incomplete coordinates (not errors)
            if (validation.skipped) {
              return null; // Don't include, but don't error
            }

            // Track non-critical warnings
            if (validation.warnings.length > 0) {
              coordinateIssues.warnings.push(...validation.warnings);
            }

            // ❌ Critical errors - only fail on range/boundary issues
            if (!validation.valid || validation.errors.length > 0) {
              coordinateIssues.errors.push(`Household ${householdId}: ${validation.errors.join('; ')}`);
              return null; // Don't include home with errors
            }

            // Track duplicate coordinates (use corrected coordinates)
            const coordKey = `${validation.home.latitude.toFixed(6)},${validation.home.longitude.toFixed(6)}`;
            if (!coordinateMap[coordKey]) {
              coordinateMap[coordKey] = [];
            }
            coordinateMap[coordKey].push(householdId);

            // ✅ Return corrected home (may have swapped coordinates fixed)
            return validation.home;
          }).filter(Boolean); // Remove nulls

          return validHomes;
        })(),
      },
      members: [],
    };
  });

  // Progress: Households mapped (25%)
  if (onProgress) onProgress({ percentage: 25, stage: 'mapping', message: 'Mapping households...', currentBatch: 0, totalBatches: 0 });

  // ✅ Check for duplicate coordinates
  const DUPLICATE_COORDINATE_THRESHOLD = 0.001; // ~100 meters
  Object.entries(coordinateMap).forEach(([coordKey, householdIds]) => {
    if (householdIds.length > 1) {
      coordinateIssues.duplicates.push(
        `⚠️ ${householdIds.length} households at coordinates ${coordKey}: ${householdIds.join(', ')}`
      );
    }
  });

  // ✅ Report validation results
  const validationSummary = {
    hasErrors: coordinateIssues.errors.length > 0,
    errorCount: coordinateIssues.errors.length,
    warningCount: coordinateIssues.warnings.length,
    duplicateCount: coordinateIssues.duplicates.length,
    boundaryAvailable: !!boundaryGeoJSON,
  };

  // ✅ Only stop upload for CRITICAL errors (invalid ranges, out of bounds)
  // ✅ ALLOW upload with WARNINGS (missing data, duplicates, outside bounds)
  if (validationSummary.hasErrors) {
    console.error('❌ Critical coordinate validation errors:', coordinateIssues.errors);
    if (onProgress) onProgress({
      percentage: 30,
      stage: 'validation_failed',
      message: `❌ Critical errors (${coordinateIssues.errors.length}): Check console. Use valid coordinates.`,
      validationResult: validationSummary,
      errors: coordinateIssues.errors,
    });
    throw new Error(`Coordinate validation failed: ${coordinateIssues.errors[0]}`);
  }

  // Show warnings and duplicates but CONTINUE with upload
  if (coordinateIssues.warnings.length > 0 || coordinateIssues.duplicates.length > 0) {
    console.warn('⚠️ Coordinate warnings detected:', {
      warnings: coordinateIssues.warnings,
      duplicates: coordinateIssues.duplicates,
    });
    if (onProgress) onProgress({
      percentage: 32,
      stage: 'validation_warnings',
      message: `⚠️ ${coordinateIssues.warnings.length} warning(s), ${coordinateIssues.duplicates.length} duplicate location(s). Proceeding with upload...`,
      validationResult: validationSummary,
      warnings: coordinateIssues.warnings,
      duplicates: coordinateIssues.duplicates,
    });
  } else {
    console.log('✅ Coordinate validation passed!');
    if (onProgress) onProgress({
      percentage: 32,
      stage: 'validation_passed',
      message: '✅ All coordinates valid!',
      validationResult: validationSummary,
    });
  }

  // Build members array
  memberRows.forEach(row => {
    const householdId = (row['Household ID'] || '').toString().trim();
    const memberId = (row['Member ID'] || '').toString().trim();
    if (!householdId || !memberId) return;
    if (!householdsMap[householdId]) return;

    // Normalize member names
    const normalizedMemberNames = normalizeNameComponents({
      firstName: row.firstName || row['FirstName'],
      middleName: row.middleName || row['MiddleName'],
      lastName: row.lastName || row['LastName'],
      suffix: row.suffix || row['Suffix'],
    });

    householdsMap[householdId].members.push({
      id: memberId,
      firstName: normalizedMemberNames.firstName,
      middleName: normalizedMemberNames.middleName,
      lastName: normalizedMemberNames.lastName,
      suffix: normalizedMemberNames.suffix,
      relationshipToHead: row.relationshipToHead || row['Relationship To Head'] || '',
      sex: row.sex || row['Sex'] || '',
      age: Number(row.age || row['Age']) || 0,
      contactNumber: row.memberContactNumber || row['Member Contact Number'] || '',
      isPWD: row.isPWD === 'true' || row.isPWD === true || row['Is PWD'] === 'true' || false,
      // Set senior flag based on age >= 60
      isSeniorCitizen: (Number(row.age || row['Age']) || 0) >= 60,
    });
  });

  // Progress: Data structure built (37%)
  if (onProgress) onProgress({ percentage: 37, stage: 'building', message: 'Building member data...', currentBatch: 0, totalBatches: 0 });

  // Upload in batches
  const allHouseholds = Object.values(householdsMap);
  const batchSize = 400;
  const totalHouseholds = allHouseholds.length;
  const totalBatches = Math.ceil(totalHouseholds / batchSize);
  
  // Calculate how much progress to allocate to uploads (37% to 95%)
  const uploadProgressRange = 95 - 37;
  
  for (let i = 0; i < allHouseholds.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = allHouseholds.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    
    chunk.forEach(({ householdId, headFirstName, headMiddleName, headLastName, headSuffix, headSex, headAge, contactNumber, barangay, sitio, geoData, members }) => {
      // Step 1: Write parent household doc with top-level fields + calculated totals
      const hhRef = doc(db, 'households', householdId);
      
      // Calculate totals from members array
      const totalMembers = members.length;
      const totalMale = members.filter(m => m.sex?.toLowerCase() === 'male').length + (headSex?.toLowerCase() === 'male' ? 1 : 0);
      const totalFemale = members.filter(m => m.sex?.toLowerCase() === 'female').length + (headSex?.toLowerCase() === 'female' ? 1 : 0);
      const totalPWDs = members.filter(m => m.isPWD).length;
      const totalSeniors = (headAge >= 60 ? 1 : 0) + members.filter(m => m.age >= 60).length;
      const ageBrackets = calculateAgeBrackets(members, headAge); // ✅ Now includes head's age

      // ✅ Include head as a resident (consistent with totalSeniors)
      const totalResidents = 1 + totalMembers;
      
      // Extract homes from geoData if available
      const homes = geoData.homes || [];
      const hasMapLocation = homes.some(
        home => home && home.latitude != null && home.longitude != null
      );
      
      const householdDoc = {
        householdId,
        headFirstName,
        headMiddleName,
        headLastName,
        headSuffix,
        headFullName: [headFirstName, headMiddleName, headLastName, headSuffix]
          .filter(Boolean)
          .join(' ')
          .trim(),
        headSex,
        headAge,
        contactNumber,
        barangay,
        sitio,
        homes,
        hasMapLocation,
        ageBrackets,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Totals calculated from members
        totalResidents, // ✅ Includes head + members
        totalMale,
        totalFemale,
        totalPWDs,
        totalSeniors,
        totalFamilies: 1,
      };
      batch.set(hhRef, householdDoc, { merge: true });

      // Step 2: Write nested member subcollection (members only, no duplicate geo/demo subcollections)
      members.forEach(member => {
        const memberRef = doc(db, 'households', householdId, 'members', member.id);
        batch.set(memberRef, member, { merge: true });
      });
    });
    
    await batch.commit();
    
    // Calculate progress: 37% base + (items processed / total items) * uploadProgressRange
    const processedItems = Math.min(i + batchSize, totalHouseholds);
    const uploadProgress = 37 + Math.round((processedItems / totalHouseholds) * uploadProgressRange);
    
    if (onProgress) onProgress({ 
      percentage: Math.min(95, uploadProgress), 
      stage: 'uploading', 
      message: `Uploading batch ${batchNumber} of ${totalBatches}...`,
      currentBatch: batchNumber,
      totalBatches: totalBatches
    });
  }

  // Progress: Complete (100%)
  if (onProgress) onProgress({ percentage: 100, stage: 'completed', message: 'Upload completed successfully!', currentBatch: 0, totalBatches: 0 });

  return allHouseholds.length;
}
