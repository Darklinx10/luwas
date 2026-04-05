/**
 * app/api/dashboard/route.js
 * 
 * GET /api/dashboard - Efficient dashboard summary using top-level household fields
 * 
 * Uses household summary fields instead of nested subcollection reads:
 * - totalResidents (from members count)
 * - totalMale / totalFemale (from member sex counts)
 * - totalPWDs (from member isPWD counts)
 * - totalSeniors (from member age >= 60)
 * - barangay (for grouping)
 * 
 * This is ~100x faster than reading nested subcollections!
 * 
 * Returns:
 * - Total households, residents, families
 * - Demographics (male, female, PWDs, seniors)
 * - Mapped households with coordinates
 * - Residents grouped by barangay
 * - Hazards and accidents counts
 * 
 * Auth required. Secretary gets only their barangay data.
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import { adminDb } from '@/lib/firebaseAdmin';
import { logFirestoreError, analyzeFirestoreError } from '@/lib/api/firestoreErrorHandler';

export async function GET(request) {
  console.log('📊 GET /api/dashboard called');

  // ✅ Verify authentication
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required' },
      { status: 401 }
    );
  }

  // 🔐 Only Secretary, Personnel, and Admin can view dashboard
  if (!['Brgy-Secretary', 'MDRRMC-Personnel', 'MDRRMC-Admin'].includes(user.role)) {
    return NextResponse.json(
      { error: 'Forbidden: Dashboard access required' },
      { status: 403 }
    );
  }

  try {
    // ============================================
    // HOUSEHOLDS DATA (FAST - no nested reads)
    // ============================================
    let householdsQuery = adminDb.collection('households');

    // 🔐 Secretary can only see their barangay
    if (user.role === 'Brgy-Secretary') {
      if (!user.barangay) {
        return NextResponse.json(
          { error: 'Secretary barangay not configured' },
          { status: 403 }
        );
      }
      householdsQuery = householdsQuery.where('barangay', '==', user.barangay);
    }

    console.log(`🔍 Fetching households...`);

    const householdSnap = await householdsQuery.get();

    console.log(`✅ Fetched ${householdSnap.size} households`);

    // Aggregate summary fields
    let totalHouseholds = 0;
    let totalResidents = 0;
    let totalFamilies = 0;
    let totalMale = 0;
    let totalFemale = 0;
    let totalPWDs = 0;
    let totalSeniors = 0;
    let mappedHouseholds = 0;
    const barangayCounts = {};

    // Initialize age bracket counts
    const ageBracketCounts = {
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

    householdSnap.forEach((doc) => {
      const data = doc.data();

      // Skip if no basic household info
      if (!data.householdId && !data.headFirstName && !data.barangay) {
        return;
      }

      totalHouseholds++;

      // ✅ Use top-level summary fields (NO nested reads!)
      const residents = Number(data.totalResidents) || 0;
      const families = Number(data.totalFamilies) || 1;
      const male = Number(data.totalMale) || 0;
      const female = Number(data.totalFemale) || 0;
      const pwds = Number(data.totalPWDs) || 0;
      const seniors = Number(data.totalSeniors) || 0;

      totalResidents += residents;
      totalFamilies += families;
      totalMale += male;
      totalFemale += female;
      totalPWDs += pwds;
      totalSeniors += seniors;

      // Aggregate age brackets from household data
      if (data.ageBrackets && typeof data.ageBrackets === 'object') {
        Object.entries(data.ageBrackets).forEach(([bracket, count]) => {
          if (ageBracketCounts.hasOwnProperty(bracket)) {
            ageBracketCounts[bracket] += Number(count) || 0;
          }
        });
      }

      // Count households with map locations
      if (data.homes && Array.isArray(data.homes) && data.homes.length > 0) {
        const hasValidLocation = data.homes.some(
          (home) =>
            home &&
            home.latitude !== undefined &&
            home.longitude !== undefined &&
            home.latitude !== null &&
            home.longitude !== null
        );
        if (hasValidLocation) {
          mappedHouseholds++;
        }
      }

      // Group by barangay
      if (data.barangay) {
        const barangayKey = data.barangay.toLowerCase();
        barangayCounts[barangayKey] = (barangayCounts[barangayKey] || 0) + residents;
      }
    });

    // Format barangay data
    const barangayResidents = Object.entries(barangayCounts)
      .map(([name, residents]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        residents,
      }))
      .sort((a, b) => b.residents - a.residents);

    // ============================================
    // HAZARDS & ACCIDENTS (still needed)
    // ============================================
    console.log('🔍 Fetching hazards and accidents...');

    const hazardTypes = [
      'Active Faults',
      'Earthquake Induced Landslide',
      'Ground Shaking',
      'Landslide',
      'Liquefaction',
      'Rain Induced Landslide',
      'Storm Surge',
      'Tsunami',
    ];

    const hazardSnaps = await Promise.all(
      hazardTypes.map((h) =>
        adminDb.collection('hazards').doc(h).collection('hazardInfo').count().get()
      )
    );

    const totalHazards = hazardSnaps.reduce((sum, snap) => sum + (snap.data().count || 0), 0);

    const accidentsSnap = await adminDb.collection('accidents').count().get();
    const totalAccidents = accidentsSnap.data().count || 0;

    console.log(`✅ Hazards: ${totalHazards}, Accidents: ${totalAccidents}`);

    // ============================================
    // AGE BRACKET DATA (aggregated from household top-level fields)
    // ============================================
    const ageBracketData = [
      { age: 'Under 1', count: ageBracketCounts['Under 1'] },
      { age: '1-4', count: ageBracketCounts['1-4'] },
      { age: '5-9', count: ageBracketCounts['5-9'] },
      { age: '10-14', count: ageBracketCounts['10-14'] },
      { age: '15-19', count: ageBracketCounts['15-19'] },
      { age: '20-24', count: ageBracketCounts['20-24'] },
      { age: '25-29', count: ageBracketCounts['25-29'] },
      { age: '30-34', count: ageBracketCounts['30-34'] },
      { age: '35-39', count: ageBracketCounts['35-39'] },
      { age: '40-44', count: ageBracketCounts['40-44'] },
      { age: '45-49', count: ageBracketCounts['45-49'] },
      { age: '50-54', count: ageBracketCounts['50-54'] },
      { age: '55-59', count: ageBracketCounts['55-59'] },
      { age: '60 and over', count: ageBracketCounts['60 and over'] },
    ];

    // ============================================
    // COMPILE DASHBOARD SUMMARY
    // ============================================
    const stats = {
      summary: {
        totalHouseholds,
        totalResidents,
        totalFamilies,
        mappedHouseholds,
        residentCoveragePercent:
          totalHouseholds > 0 ? Math.round((mappedHouseholds / totalHouseholds) * 100) : 0,
      },
      demographics: {
        totalMale,
        totalFemale,
        totalPWDs,
        totalSeniors,
        malePercent: totalResidents > 0 ? Math.round((totalMale / totalResidents) * 100) : 0,
        femalePercent: totalResidents > 0 ? Math.round((totalFemale / totalResidents) * 100) : 0,
      },
      ageBracketData,
      hazardsAndAccidents: {
        totalHazards,
        totalAccidents,
      },
      barangayResidents,
      timestamp: new Date().toISOString(),
    };

    console.log('✅ Dashboard compiled:', {
      households: totalHouseholds,
      residents: totalResidents,
      pwds: totalPWDs,
      seniors: totalSeniors,
      mapped: mappedHouseholds,
      hazards: totalHazards,
      accidents: totalAccidents,
    });

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (queryError) {
    // Intelligent error handling for Firestore composite index errors
    if (queryError?.code === 9 || queryError?.message?.includes('FAILED_PRECONDITION')) {
      const queryMetadata = {
        collection: 'households',
        where: [],
        orderBy: [],
        pagination: 'offset',
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

    console.error('❌ GET /api/dashboard error:', queryError?.message || queryError);
    return NextResponse.json(
      { error: queryError?.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
