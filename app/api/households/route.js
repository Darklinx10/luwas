/**
 * app/api/households/route.js
 * 
 * GET /api/households - Fetch paginated household list
 * POST /api/households - Create new household
 * 
 * Auth required for both
 * Secretary can only access their own barangay
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import {
  fetchHouseholdsQuery,
  createHousehold,
} from '@/lib/api/householdService';
import { buildHouseholdPayload } from '@/features/Households/utils/buildHouseholdPayload';
import { recalculateHouseholdTotals } from '@/lib/api/recalculateTotals';
import { logFirestoreError, analyzeFirestoreError } from '@/lib/api/firestoreErrorHandler';

// ALLOWED_SORT_FIELDS must match available Firestore composite indexes
// Available indexes support sorting by:
// - Name fields: headLastName, headFirstName, headMiddleName, headSuffix
// - Special fields: totalPWDs, totalSeniors, hasMapLocation
const ALLOWED_SORT_FIELDS = [
  'headLastName',    // Index: headLastName, headFirstName, headMiddleName, headSuffix, __name__
  'headFirstName',   // OR barangay, headLastName, headFirstName, headMiddleName, headSuffix, __name__
  'headMiddleName',
  'headSuffix',
  'totalPWDs',       // Index: totalPWDs, headLastName, __name__ OR barangay, totalPWDs, __name__
  'totalSeniors',    // Index: totalSeniors, headLastName, __name__ OR barangay, totalSeniors, __name__
  'hasMapLocation',  // Index: hasMapLocation, headLastName, __name__
];

export async function GET(request) {
  console.log('➡️ GET /api/households called');

  // ✅ Verify authentication
  const user = await getSessionUser();
  console.log('👤 Session user:', user ? {
    uid: user.uid,
    role: user.role,
    barangay: user.barangay,
  } : null);

  if (!user) {
    console.log('⛔ Unauthorized request');
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required' },
      { status: 401 }
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = (searchParams.get('search') || '').trim();

    const requestedSort = searchParams.get('sort') || 'headLastName';
    const sort = ALLOWED_SORT_FIELDS.includes(requestedSort)
      ? requestedSort
      : 'headLastName';

    const requestedOrder = searchParams.get('order') || 'asc';
    const order = ['asc', 'desc'].includes(requestedOrder)
      ? requestedOrder
      : 'asc';

    console.log('📥 Query params:', {
      page,
      limit,
      search,
      requestedSort,
      sort,
      requestedOrder,
      order,
    });

    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
      console.log('⛔ Invalid pagination params');
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // 🔐 Secretary can only access their barangay
    let barangayFilter = null;
    if (user.role === 'Brgy-Secretary') {
      barangayFilter = user.barangay;
    }

    console.log('🏘️ Barangay filter:', barangayFilter);

    let result;
    try {
      result = await fetchHouseholdsQuery({
        page,
        limit,
        search,
        sort,
        order,
        barangay: barangayFilter,
      });
    } catch (queryError) {
      // Intelligent error handling for Firestore composite index errors
      if (queryError?.code === 9 || queryError?.message?.includes('FAILED_PRECONDITION')) {
        const queryMetadata = {
          collection: 'households',
          where: barangayFilter ? [{ field: 'barangay', operator: '==', value: barangayFilter }] : [],
          orderBy: [
            { field: 'headLastName', direction: order },
            { field: 'headFirstName', direction: order },
            { field: 'headMiddleName', direction: order },
          ],
          pagination: 'offset',
        };

        // Log detailed analysis for developers
        logFirestoreError(queryError, queryMetadata);
        
        // Return actionable error response
        const analysis = analyzeFirestoreError(queryError, queryMetadata);
        
        return NextResponse.json(
          {
            error: 'Firestore composite index required',
            errorCode: queryError.code,
            isIndexError: true,
            explanation: analysis.explanation,
            queryFields: analysis.fields,
            suggestions: analysis.suggestions,
            paginationRecommendation: analysis.paginationRecommendation,
            actionSteps: analysis.actionSteps,
            ...(analysis.indexUrl && { 
              consoleLink: analysis.indexUrl,
              details: `The query requires an index. You can create it here: ${analysis.indexUrl}`,
            }),
            message: 'Please follow the action steps or click consoleLink to create the required Firestore composite index.',
          },
          { status: 503 }
        );
      }
      
      // Re-throw other errors
      throw queryError;
    }

    console.log('✅ fetchHouseholdsQuery success:', {
      count: result.households?.length || 0,
      totalCount: result.totalCount,
      totalResidents: result.totalResidents,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    });

    // Check if any households have missing totalResidents (legacy data)
    // If so, recalculate them in the background
    const householdsNeedingRecalc = (result.households || []).filter(
      (h) => !h.totalResidents || h.totalResidents === 0
    );

    if (householdsNeedingRecalc.length > 0) {
      console.log(`⚠️ Found ${householdsNeedingRecalc.length} households needing recalculation`);
      
      // Recalculate in background (don't wait for response)
      householdsNeedingRecalc.forEach((h) => {
        recalculateHouseholdTotals(h.householdId)
          .then(() => {
            console.log(`✅ Recalculated totals for household ${h.householdId}`);
          })
          .catch((err) => {
            console.error(`❌ Failed to recalculate ${h.householdId}:`, err.message);
          });
      });
    }

    return NextResponse.json({
      households: result.households,
      totalHouseholds: result.totalCount,
      totalResidents: result.totalResidents,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    });
  } catch (error) {
    console.error('❌ GET /api/households error:', error?.message || error);

    // Handle Firestore composite index required error
    if (error?.code === 9 || error?.message?.includes('FAILED_PRECONDITION')) {
      const queryMetadata = {
        collection: 'households',
        where: [{ field: 'barangay', operator: '==', value: 'any' }],
        orderBy: [
          { field: 'headLastName', direction: 'asc' },
          { field: 'headFirstName', direction: 'asc' },
        ],
        pagination: 'offset',
      };

      // Log detailed analysis
      logFirestoreError(error, queryMetadata);
      
      // Return actionable error response
      const analysis = analyzeFirestoreError(error, queryMetadata);
      
      return NextResponse.json(
        {
          error: 'Firestore composite index required',
          errorCode: error.code,
          isIndexError: true,
          explanation: analysis.explanation,
          queryFields: analysis.fields,
          suggestions: analysis.suggestions,
          paginationRecommendation: analysis.paginationRecommendation,
          actionSteps: analysis.actionSteps,
          ...(analysis.indexUrl && { 
            consoleLink: analysis.indexUrl,
            details: `The query requires an index. You can create it here: ${analysis.indexUrl}`,
          }),
          message: 'Please follow the action steps or click consoleLink to create the required index.',
        },
        { status: 503 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch households' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  console.log('➡️ POST /api/households called');

  // ✅ Verify authentication
  const user = await getSessionUser();
  console.log('👤 Session user:', user ? {
    uid: user.uid,
    role: user.role,
    barangay: user.barangay,
  } : null);

  if (!user) {
    console.log('⛔ Unauthorized request');
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required' },
      { status: 401 }
    );
  }

  // 🔐 Only Secretary and Admin can create households
  if (!['Brgy-Secretary', 'MDRRMC-Admin'].includes(user.role)) {
    console.log('⛔ Forbidden role for create:', user.role);
    return NextResponse.json(
      { error: 'Forbidden: Only Secretaries and Admins can create households' },
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
    const body = await request.json();

    // Use shared buildHouseholdPayload to ensure consistent top-level field generation
    // This guarantees manual add and upload create the same Household structure
    const payload = buildHouseholdPayload({
      householdId: body.householdId,
      headFirstName: body.headFirstName,
      headMiddleName: body.headMiddleName,
      headLastName: body.headLastName,
      headSuffix: body.headSuffix,
      headSex: body.headSex,
      headAge: body.headAge,
      contactNumber: body.contactNumber,
      barangay: body.barangay,
      sitio: body.sitio,
      homes: body.homes,
      totalFamilies: body.totalFamilies,
      totalResidents: body.totalResidents,
      totalMale: body.totalMale,
      totalFemale: body.totalFemale,
      totalPWDs: body.totalPWDs,
      totalSeniors: body.totalSeniors,
      ageBrackets: body.ageBrackets,
    });

    console.log('📦 Normalized payload:', payload);

    // Validate required fields
    const required = ['headFirstName', 'headLastName', 'barangay'];
    for (const field of required) {
      if (!payload[field]) {
        console.log(`⛔ Missing required field: ${field}`);
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // 🔐 Secretary can only create households in their barangay
    if (user.role === 'Brgy-Secretary' && payload.barangay !== user.barangay) {
      console.log('⛔ Secretary tried to create outside own barangay');
      return NextResponse.json(
        { error: 'Forbidden: Can only create households in your barangay' },
        { status: 403 }
      );
    }

    const householdId = await createHousehold(payload, user.uid);
    console.log('✅ Household created:', householdId);

    return NextResponse.json(
      {
        success: true,
        householdId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ POST /api/households error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create household' },
      { status: 500 }
    );
  }
}