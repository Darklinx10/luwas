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
import { recalculateHouseholdTotals } from '@/lib/api/recalculateTotals';

const ALLOWED_SORT_FIELDS = [
  'headLastName',
  'headFirstName',
  'barangay',
  'sitio',
  'createdAt',
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

    const result = await fetchHouseholdsQuery({
      page,
      limit,
      search,
      sort,
      order,
      barangay: barangayFilter,
    });

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
    console.error('❌ GET /api/households error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch households' },
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

    const payload = {
      ...body,
      headFirstName: body.headFirstName?.trim() || '',
      headLastName: body.headLastName?.trim() || '',
      barangay: body.barangay?.trim() || '',
      sitio: body.sitio?.trim() || '',
      contactNumber: body.contactNumber?.trim() || '',
    };

    console.log('📦 Payload:', payload);

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