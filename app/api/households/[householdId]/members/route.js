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
  } catch (error) {
    console.error(
      `❌ GET /api/households/${householdId}/members error:`,
      error?.message || String(error),
      error?.stack
    );
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch members' },
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

  try {
    const params = await paramsPromise;
    const householdId = params.householdId;

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
    const required = ['firstName', 'lastName'];
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
      `POST /api/households/${params.householdId}/members error:`,
      error
    );
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    );
  }
}
