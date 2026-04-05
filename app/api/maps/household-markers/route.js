/**
 * app/api/maps/household-markers/route.js
 * 
 * GET /api/maps/household-markers - Fetch all household markers for map display
 * 
 * Returns households with ONLY top-level fields needed for markers:
 * - householdId, barangay, sitio, headFirstName, headMiddleName, headLastName, headSuffix, headFullName
 * - contactNumber, homes[], hasMapLocation, totalResidents, totalMale, totalFemale, totalPWDs, totalSeniors
 * 
 * Does NOT fetch nested collections (members, geographicIdentification, health, etc.)
 * This eliminates the N+1 read pattern and reduces quota usage dramatically!
 * 
 * Auth required. Secretary gets only their barangay households.
 * 
 * Query params:
 * - barangay (optional): Filter by barangay (auto-applied for Secretaries)
 * 
 * Returns:
 * {
 *   markers: [{householdId, barangay, sitio, headFullName, contactNumber, homes[], totalResidents, ...}],
 *   count: number,
 *   barangayFilter: string|null
 * }
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import { adminDb } from '@/lib/firebaseAdmin';
import { formatHouseholdName } from '@/features/Map/utils/formatHouseholdName';
import { logFirestoreError, analyzeFirestoreError } from '@/lib/api/firestoreErrorHandler';

export async function GET(request) {
  console.log('🗺️ GET /api/maps/household-markers called');

  // ✅ Verify authentication
  const user = await getSessionUser(request);
  if (!user) {
    console.log('⛔ Unauthorized request');
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required' },
      { status: 401 }
    );
  }

  // 🔐 Only Secretary, Personnel, and Admin can view map
  if (!['Brgy-Secretary', 'MDRRMC-Personnel', 'MDRRMC-Admin'].includes(user.role)) {
    console.log('⛔ Unauthorized role:', user.role);
    return NextResponse.json(
      { error: 'Forbidden: Map access required' },
      { status: 403 }
    );
  }

  // 🔐 Secretary must have barangay configured
  if (user.role === 'Brgy-Secretary' && !user.barangay) {
    console.log('⛔ Secretary has no barangay configured');
    return NextResponse.json(
      { error: 'Forbidden: Secretary barangay is not configured' },
      { status: 403 }
    );
  }

  try {
    // 🔐 Secretary can only access their barangay
    let barangayFilter = null;
    if (user.role === 'Brgy-Secretary') {
      barangayFilter = user.barangay;
      console.log('🏘️ Secretary filter - barangay:', barangayFilter);
    }

    // Build query to fetch ALL households (no pagination for map)
    let query = adminDb.collection('households');

    // Apply barangay filter if needed
    if (barangayFilter) {
      query = query.where('barangay', '==', barangayFilter);
    }

    console.log('📤 Executing Firestore query for households...');
    const snapshot = await query.get();
    console.log(`📍 Total households fetched: ${snapshot.size}`);

    // Extract markers with ONLY top-level fields
    const markers = [];
    let processedCount = 0;
    let errorCount = 0;

    snapshot.forEach((doc) => {
      try {
        processedCount++;
        const data = doc.data();

        if (!data || typeof data !== 'object') {
          console.warn(`⚠️ Household ${doc.id} has invalid data structure`);
          return;
        }

        const homes = Array.isArray(data.homes) ? data.homes : [];

        if (data.hasMapLocation && homes.length > 0) {
          homes.forEach((home, index) => {
            try {
              if (!home || typeof home !== 'object') {
                console.warn(`⚠️ Household ${doc.id} home ${index} has invalid structure`);
                return;
              }

              const lat = Number(home.latitude);
              const lng = Number(home.longitude);

              if (!isNaN(lat) && !isNaN(lng)) {
                markers.push({
                  id: `${doc.id}_${index}`,
                  householdId: doc.id,
                  homeIndex: index,
                  homeLabel: home.label || (index === 0 ? 'Primary Home' : `Home ${index + 1}`),
                  headFullName: formatHouseholdName(data),
                  headFirstName: data.headFirstName || '',
                  headMiddleName: data.headMiddleName || '',
                  headLastName: data.headLastName || '',
                  headSuffix: data.headSuffix || '',
                  barangay: data.barangay || 'N/A',
                  sitio: data.sitio || 'N/A',
                  contactNumber: data.contactNumber || 'N/A',
                  lat,
                  lng,
                  totalResidents: data.totalResidents || 0,
                  totalMale: data.totalMale || 0,
                  totalFemale: data.totalFemale || 0,
                  totalPWDs: data.totalPWDs || 0,
                  totalSeniors: data.totalSeniors || 0,
                });
              }
            } catch (homeError) {
              errorCount++;
              console.error(`❌ Error processing home ${index} for ${doc.id}:`, homeError.message);
            }
          });
        }
      } catch (docError) {
        errorCount++;
        console.error(`❌ Error processing document ${doc.id}:`, docError.message);
      }
    });

    console.log(`✅ Created ${markers.length} markers (processed: ${processedCount}, errors: ${errorCount})`);

    return NextResponse.json({
      markers,
      count: markers.length,
      householdCount: snapshot.size,
      barangayFilter,
    });
  } catch (queryError) {
    // Intelligent error handling for Firestore composite index errors
    if (queryError?.code === 9 || queryError?.message?.includes('FAILED_PRECONDITION')) {
      const queryMetadata = {
        collection: 'households',
        where: [],
        orderBy: [],
        pagination: 'no-pagination',
      };

      logFirestoreError(queryError, queryMetadata);
      const analysis = analyzeFirestoreError(queryError, queryMetadata);

      return NextResponse.json(
        {
          error: 'Firestore composite index required',
          errorCode: queryError.code,
          isIndexError: true,
          consoleLink: analysis.indexUrl,
          explanation: analysis.explanation,
          message: 'An index is required for this query.',
        },
        { status: 503 }
      );
    }

    console.error('❌ GET /api/maps/household-markers error:', queryError);
    console.error('Error type:', queryError.name);
    console.error('Stack:', queryError.stack);
    return NextResponse.json(
      {
        error: queryError.message || 'Failed to fetch household markers',
        type: queryError.name,
      },
      { status: 500 }
    );
  }
}
