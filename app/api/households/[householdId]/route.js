/**
 * app/api/households/[householdId]/route.js
 * 
 * GET /api/households/[id] - Get household details
 * PATCH /api/households/[id] - Update household
 * DELETE /api/households/[id] - Delete household
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import {
  getHousehold,
  updateHousehold,
  deleteHousehold,
} from '@/lib/api/householdService';
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

  try {
    const params = await paramsPromise;
    const householdId = params.householdId;

    if (!householdId) {
      return NextResponse.json(
        { error: 'Missing household ID' },
        { status: 400 }
      );
    }

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
        { error: 'Forbidden: Cannot access household outside your barangay' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      household,
    });
  } catch (queryError) {
    // Intelligent error handling for Firestore composite index errors
    if (queryError?.code === 9 || queryError?.message?.includes('FAILED_PRECONDITION')) {
      const analysis = analyzeFirestoreError(queryError, { collection: 'households' });
      logFirestoreError(queryError, { collection: 'households' });

      return NextResponse.json(
        {
          error: 'Firestore error',
          errorCode: queryError.code,
          isIndexError: true,
          consoleLink: analysis.indexUrl,
          message: analysis.explanation,
        },
        { status: 500 }
      );
    }

    console.error(`GET /api/households error:`, queryError);
    return NextResponse.json(
      { error: 'Failed to fetch household' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params: paramsPromise }) {
  // ✅ Verify authentication
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required' },
      { status: 401 }
    );
  }

  // 🔐 Only Secretary and Admin can update households
  if (!['Brgy-Secretary', 'MDRRMC-Admin'].includes(user.role)) {
    return NextResponse.json(
      { error: 'Forbidden: Only Secretaries and Admins can update households' },
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

    const household = await getHousehold(householdId);

    if (!household) {
      return NextResponse.json(
        { error: 'Household not found' },
        { status: 404 }
      );
    }

    // 🔐 Secretary can only update households in their barangay
    if (
      user.role === 'Brgy-Secretary' &&
      household.barangay !== user.barangay
    ) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot update household outside your barangay' },
        { status: 403 }
      );
    }

    const payload = await request.json();

    // Prevent barangay changes by Secretary
    if (user.role === 'Brgy-Secretary' && payload.barangay) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot change household barangay' },
        { status: 403 }
      );
    }

    await updateHousehold(householdId, payload, user.uid);

    return NextResponse.json({
      success: true,
      message: 'Household updated successfully',
    });
  } catch (queryError) {
    // Intelligent error handling for Firestore composite index errors
    if (queryError?.code === 9 || queryError?.message?.includes('FAILED_PRECONDITION')) {
      const analysis = analyzeFirestoreError(queryError, { collection: 'households' });
      logFirestoreError(queryError, { collection: 'households' });

      return NextResponse.json(
        {
          error: 'Firestore error',
          errorCode: queryError.code,
          isIndexError: true,
          consoleLink: analysis.indexUrl,
          message: analysis.explanation,
        },
        { status: 500 }
      );
    }

    console.error(
      `PATCH /api/households error:`,
      queryError
    );
    return NextResponse.json(
      { error: 'Failed to update household' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params: paramsPromise }) {
  // ✅ Verify authentication
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required' },
      { status: 401 }
    );
  }

  // 🔐 Only Admin can delete households
  if (user.role !== 'MDRRMC-Admin') {
    return NextResponse.json(
      { error: 'Forbidden: Only Admins can delete households' },
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

    const household = await getHousehold(householdId);

    if (!household) {
      return NextResponse.json(
        { error: 'Household not found' },
        { status: 404 }
      );
    }

    await deleteHousehold(householdId);

    return NextResponse.json({
      success: true,
      message: 'Household deleted successfully',
    });
  } catch (queryError) {
    // Intelligent error handling for Firestore composite index errors
    if (queryError?.code === 9 || queryError?.message?.includes('FAILED_PRECONDITION')) {
      const analysis = analyzeFirestoreError(queryError, { collection: 'households' });
      logFirestoreError(queryError, { collection: 'households' });

      return NextResponse.json(
        {
          error: 'Firestore error',
          errorCode: queryError.code,
          isIndexError: true,
          consoleLink: analysis.indexUrl,
          message: analysis.explanation,
        },
        { status: 500 }
      );
    }

    console.error(
      `DELETE /api/households error:`,
      queryError
    );
    return NextResponse.json(
      { error: 'Failed to delete household' },
      { status: 500 }
    );
  }
}
