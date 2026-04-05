/**
 * app/api/reports/seniors/route.js
 * 
 * GET /api/reports/seniors - Fetch Senior Citizens (isSeniorCitizen = true or age >= 60)
 * 
 * Returns paginated list of all members classified as senior citizens
 * Includes household information for context
 * 
 * Query params:
 * - page: Page number (1-based)
 * - limit: Results per page
 * - search: Search by member name
 * 
 * Auth required. Secretary gets only their barangay.
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import { adminDb } from '@/lib/firebaseAdmin';
import { logFirestoreError, analyzeFirestoreError } from '@/lib/api/firestoreErrorHandler';

export async function GET(request) {
  // ✅ Verify authentication
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = (searchParams.get('search') || '').trim();

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // ✅ OPTIMIZED: Use collectionGroup query instead of N+1 pattern
    // Get all senior members across all accessible households in ONE query
    let memberQuery = adminDb.collectionGroup('members').where('isSeniorCitizen', '==', true);

    let memberSnap;
    try {
      memberSnap = await memberQuery.get();
    } catch (queryError) {
      // Handle Firestore composite index errors
      if (queryError?.code === 9 || queryError?.message?.includes('FAILED_PRECONDITION')) {
        const queryMetadata = {
          collection: 'members',
          where: [{ field: 'isSeniorCitizen', operator: '==', value: true }],
          orderBy: [],
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
      
      // Re-throw other errors to be handled by outer catch block
      throw queryError;
    }

    // Collect household IDs we need to fetch
    const householdIdsToFetch = new Set();

    memberSnap.forEach((memDoc) => {
      const householdId = memDoc.ref.parent.parent.id;
      householdIdsToFetch.add(householdId);
    });

    // ✅ Filter accessible households if Secretary
    let accessibleHouseholds = new Set(householdIdsToFetch);
    if (user.role === 'Brgy-Secretary') {
      const barangayHouseholds = await adminDb
        .collection('households')
        .where('barangay', '==', user.barangay)
        .select()
        .get();

      accessibleHouseholds = new Set(
        barangayHouseholds.docs.map(doc => doc.id)
      );
    }

    // Fetch household data for all needed households in parallel
    const householdCache = {};
    await Promise.all(
      Array.from(householdIdsToFetch).map(async (householdId) => {
        if (!accessibleHouseholds.has(householdId)) return;

        const hhSnap = await adminDb.collection('households').doc(householdId).get();
        if (hhSnap.exists) {
          householdCache[householdId] = hhSnap.data();
        }
      })
    );

    // Collect all senior members across all accessible households
    const seniorMembers = [];
    const normalizedSearch = search.toLowerCase();

    memberSnap.forEach((memDoc) => {
      const householdId = memDoc.ref.parent.parent.id;

      // Filter by accessible households
      if (!accessibleHouseholds.has(householdId)) {
        return;
      }

      const member = memDoc.data();
      const household = householdCache[householdId];

      // Apply search filter if provided
      if (normalizedSearch) {
        const firstName = String(member.firstName || '').toLowerCase();
        const lastName = String(member.lastName || '').toLowerCase();
        const fullName = String(member.fullName || '').toLowerCase();

        if (
          !firstName.includes(normalizedSearch) &&
          !lastName.includes(normalizedSearch) &&
          !fullName.includes(normalizedSearch)
        ) {
          return; // Skip this member
        }
      }

      seniorMembers.push({
        memberId: memDoc.id,
        householdId,
        firstName: member.firstName || '',
        middleName: member.middleName || '',
        lastName: member.lastName || '',
        fullName: member.fullName || '',
        age: member.age || null,
        birthdate: member.birthdate || '',
        sex: member.sex || '',
        contactNumber: member.contactNumber || '',
        headFirstName: household?.headFirstName || '',
        headLastName: household?.headLastName || '',
        headFullName: household?.headFullName || '',
        householdBarangay: household?.barangay || '',
        householdSitio: household?.sitio || '',
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      });
    });

    // Sort by last name, then first name
    seniorMembers.sort((a, b) => {
      const lastNameCmp = a.lastName.localeCompare(b.lastName);
      if (lastNameCmp !== 0) return lastNameCmp;
      return a.firstName.localeCompare(b.firstName);
    });

    // Paginate
    const totalCount = seniorMembers.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const skip = (page - 1) * limit;
    const paginatedMembers = seniorMembers.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      members: paginatedMembers,
      totalMembers: totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (error) {
    console.error('GET /api/reports/seniors error:', error);

    // Handle Firestore composite index required error
    if (error?.code === 9 || error?.message?.includes('FAILED_PRECONDITION')) {
      // Extract index creation link from either error.message or error.details
      let indexLink = null;
      const messageMatch = error?.message?.match(/(https:\/\/console\.firebase\.google\.com\/[^\s]+)/);
      const detailsMatch = error?.details?.match(/(https:\/\/console\.firebase\.google\.com\/[^\s]+)/);
      
      if (messageMatch) indexLink = messageMatch[1];
      if (!indexLink && detailsMatch) indexLink = detailsMatch[1];

      const queryMetadata = {
        collection: 'members',
        where: [{ field: 'isSeniorCitizen', operator: '==', value: true }],
        orderBy: [],
        pagination: 'offset',
      };

      // Log detailed analysis
      logFirestoreError(error, queryMetadata);
      
      // Return actionable error response
      const analysis = analyzeFirestoreError(error, queryMetadata);
      console.error('\n� FIREBASE ERROR DETAILS:');
      console.error('  Error Code:', error.code);
      console.error('  Error Message:', error.message);
      if (error.details) {
        console.error('  Error Details:', error.details);
      }
      console.error('\n🔍 QUERY ANALYSIS:');
      console.error('  Collection: members (collectionGroup)');
      console.error('  Filter: isSeniorCitizen == true');
      console.error('  Fields requiring index: [isSeniorCitizen]');
      console.error('\n📋 ACTION REQUIRED:');
      if (indexLink) {
        console.error('  1. Click the link below to open Firebase Console');
        console.error('  2. Create the composite index');
        console.error('  3. Wait 2-5 minutes for the index to be built');
        console.error('  4. Retry the request\n');
        console.error(indexLink);
      } else {
        console.error('  1. Go to: https://console.firebase.google.com');
        console.error('  2. Navigate to: Firestore > Indexes > Composite');
        console.error('  3. Create a new index with:');
        console.error('     - Collection: members');
        console.error('     - Field: isSeniorCitizen (Ascending)');
        console.error('  4. Wait 2-5 minutes for the index to be built');
        console.error('  5. Retry the request');
      }
      console.error('\n' + '═'.repeat(80) + '\n');
      
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

    return NextResponse.json(
      { error: 'Failed to fetch seniors report' },
      { status: 500 }
    );
  }
}
