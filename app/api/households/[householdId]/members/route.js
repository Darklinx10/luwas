/**
 * app/api/households/[householdId]/members/route.js
 * 
 * GET /api/households/[id]/members - Fetch paginated members
 * POST /api/households/[id]/members - Add new member
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import { getHousehold } from '@/lib/api/householdService';
import {
  fetchMembersQuery,
  createMember,
} from '@/lib/api/memberService';
import { logFirestoreError, analyzeFirestoreError } from '@/lib/api/firestoreErrorHandler';

export async function GET(request, { params: paramsPromise }) {
  // ✅ Verify authentication
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required' },
      { status: 401 }
    );
  }

  let householdId = 'unknown';

  try {
    const params = await paramsPromise;
    householdId = params.householdId;

    if (!householdId) {
      return NextResponse.json(
        { error: 'Missing household ID' },
        { status: 400 }
      );
    }

    // Check household exists and user has access
    const household = await getHousehold(householdId);
    if (!household) {
      return NextResponse.json(
        { error: 'Household not found' },
        { status: 404 }
      );
    }

    // 🔐 Secretary can only access their barangay
    if (
      user.role === 'Brgy-Secretary' &&
      household.barangay !== user.barangay
    ) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot access members outside your barangay' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';

    // Validate pagination
    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1 || limit > 100) {
      console.error('Invalid pagination params:', { page, limit, rawPage: searchParams.get('page'), rawLimit: searchParams.get('limit') });
      return NextResponse.json(
        { error: `Invalid pagination parameters: page=${page}, limit=${limit}` },
        { status: 400 }
      );
    }

    console.log(`📡 Fetching members for household ${householdId}:`, { page, limit, search });

    const result = await fetchMembersQuery(householdId, {
      page,
      limit,
      search,
    });

    console.log(`✅ Successfully fetched ${result.members.length} members`);

    return NextResponse.json({
      members: result.members,
      totalMembers: result.totalCount,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    });
  } catch (queryError) {
    // Intelligent error handling for Firestore composite index errors
    if (queryError?.code === 9 || queryError?.message?.includes('FAILED_PRECONDITION')) {
      const projectId = process.env.FIREBASE_PROJECT_ID || 'luwasv2';

      // Extract Firestore's auto-generated create_index link from error message
      let autoIndexLink = null;
      let isAutoLink = false;

      if (queryError.message) {
        const createIndexMatch = queryError.message.match(
          /https:\/\/console\.firebase\.google\.com[^\s]*create_index[^\s\)]+/
        );
        if (createIndexMatch) {
          autoIndexLink = createIndexMatch[0];
          isAutoLink = true;
        }
      }

      if (!autoIndexLink) {
        autoIndexLink = `https://console.firebase.google.com/u/2/project/${projectId}/firestore/databases/-default-/indexes`;
      }

      console.error('\n' + '='.repeat(80));
      console.error('❌ FIRESTORE COMPOSITE INDEX ERROR - Action Required!');
      console.error('='.repeat(80));
      console.error('\nEndpoint:', `GET /api/households/${householdId}/members`);
      console.error('Error Code:', queryError.code, '(FAILED_PRECONDITION)');
      console.error('Full Error:', queryError.toString());
      console.error('');
      console.error('📊 Collection: members (collectionGroup)');
      console.error('');

      if (isAutoLink) {
        console.error('🔗 FIREBASE AUTO-CREATE LINK (Click to auto-create index):');
        console.error(`\n  ${autoIndexLink}\n`);
      } else {
        console.error('🔗 FIREBASE INDEXES PAGE:');
        console.error(`\n  ${autoIndexLink}\n`);
      }

      console.error('='.repeat(80) + '\n');

      const queryMetadata = {
        collection: `households/${householdId}/members`,
        where: [],
        orderBy: [
          { field: 'lastName', direction: 'asc' },
          { field: 'firstName', direction: 'asc' },
          { field: 'middleName', direction: 'asc' },
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
          actionSteps: analysis.actionSteps,
          ...(analysis.indexUrl && {
            consoleLink: analysis.indexUrl,
            details: `The query requires an index. You can create it here: ${analysis.indexUrl}`,
          }),
          message: 'Please follow the action steps or click consoleLink to create the required Firestore composite index.',
        },
        { status: 500 }
      );
    }

  // Regular error handling for non-index errors
    console.error(
      `❌ GET /api/households/${householdId}/members error:`,
      queryError?.message || String(queryError),
      queryError?.stack
    );
    return NextResponse.json(
      { error: queryError?.message || 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params: paramsPromise }) {
  // ✅ Verify authentication
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required' },
      { status: 401 }
    );
  }

  // 🔐 Only Secretary and Admin can create members
  if (!['Brgy-Secretary', 'MDRRMC-Admin'].includes(user.role)) {
    return NextResponse.json(
      { error: 'Forbidden: Only Secretaries and Admins can add members' },
      { status: 403 }
    );
  }

  let householdId = 'unknown';

  try {
    const params = await paramsPromise;
    householdId = params.householdId;

    if (!householdId) {
      return NextResponse.json(
        { error: 'Missing household ID' },
        { status: 400 }
      );
    }

    // Check household exists and user has access
    const household = await getHousehold(householdId);
    if (!household) {
      return NextResponse.json(
        { error: 'Household not found' },
        { status: 404 }
      );
    }

    // 🔐 Secretary can only add members to their barangay
    if (
      user.role === 'Brgy-Secretary' &&
      household.barangay !== user.barangay
    ) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot add members outside your barangay' },
        { status: 403 }
      );
    }

    const payload = await request.json();

    // Validate required fields
    const required = ['firstName'];
    for (const field of required) {
      if (!payload[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const memberId = await createMember(householdId, payload, user.uid);

    return NextResponse.json(
      {
        success: true,
        memberId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      `POST /api/households/${householdId}/members error:`,
      error
    );
    return NextResponse.json(
      { error: error?.message || 'Failed to create member' },
      { status: 500 }
    );
  }
}
