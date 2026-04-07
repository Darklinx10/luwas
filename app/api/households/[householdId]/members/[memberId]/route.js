/**
 * app/api/households/[householdId]/members/[memberId]/route.js
 * 
 * PATCH /api/households/[id]/members/[memberId] - Update member
 * DELETE /api/households/[id]/members/[memberId] - Delete member
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import { getHousehold } from '@/lib/api/householdService';
import {
  getMember,
  updateMember,
  deleteMember,
} from '@/lib/api/memberService';
import { logFirestoreError, analyzeFirestoreError } from '@/lib/api/firestoreErrorHandler';

export async function PATCH(request, { params: paramsPromise }) {
  // ✅ Verify authentication
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required' },
      { status: 401 }
    );
  }

  // 🔐 Only Secretary and Admin can update members
  if (!['Brgy-Secretary', 'MDRRMC-Admin'].includes(user.role)) {
    return NextResponse.json(
      { error: 'Forbidden: Only Secretaries and Admins can update members' },
      { status: 403 }
    );
  }

  try {
    const params = await paramsPromise;
    const { householdId, memberId } = params;

    if (!householdId || !memberId) {
      return NextResponse.json(
        { error: 'Missing household ID or member ID' },
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

    // 🔐 Secretary can only update members in their barangay
    if (
      user.role === 'Brgy-Secretary' &&
      household.barangay !== user.barangay
    ) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot update member outside your barangay' },
        { status: 403 }
      );
    }

    const member = await getMember(householdId, memberId);
    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    const payload = await request.json();

    await updateMember(householdId, memberId, payload, user.uid);

    return NextResponse.json({
      success: true,
      message: 'Member updated successfully',
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
      console.error('\nEndpoint:', 'PATCH /api/households/[id]/members/[memberId]');
      console.error('Error Code:', queryError.code, '(FAILED_PRECONDITION)');
      console.error('Full Error:', queryError.toString());
      console.error('');

      if (isAutoLink) {
        console.error('🔗 FIREBASE AUTO-CREATE LINK:');
        console.error(`\n  ${autoIndexLink}\n`);
      } else {
        console.error('🔗 FIREBASE INDEXES PAGE:');
        console.error(`\n  ${autoIndexLink}\n`);
      }

      console.error('='.repeat(80) + '\n');

      const queryMetadata = {
        collection: 'members',
        where: [],
        orderBy: [],
        pagination: 'none',
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
          message: 'An index is required for this operation.',
        },
        { status: 503 }
      );
    }

    console.error(
      `PATCH /api/households/members error:`,
      queryError
    );
    return NextResponse.json(
      { error: 'Failed to update member' },
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

  // 🔐 Only Secretary and Admin can delete members
  if (!['Brgy-Secretary', 'MDRRMC-Admin'].includes(user.role)) {
    return NextResponse.json(
      { error: 'Forbidden: Only Secretaries and Admins can delete members' },
      { status: 403 }
    );
  }

  try {
    const params = await paramsPromise;
    const { householdId, memberId } = params;

    if (!householdId || !memberId) {
      return NextResponse.json(
        { error: 'Missing household ID or member ID' },
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

    // 🔐 Secretary can only delete members in their barangay
    if (
      user.role === 'Brgy-Secretary' &&
      household.barangay !== user.barangay
    ) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot delete member outside your barangay' },
        { status: 403 }
      );
    }

    const member = await getMember(householdId, memberId);
    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    await deleteMember(householdId, memberId);

    return NextResponse.json({
      success: true,
      message: 'Member deleted successfully',
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
      console.error('\nEndpoint:', 'DELETE /api/households/[id]/members/[memberId]');
      console.error('Error Code:', queryError.code, '(FAILED_PRECONDITION)');
      console.error('Full Error:', queryError.toString());
      console.error('');

      if (isAutoLink) {
        console.error('🔗 FIREBASE AUTO-CREATE LINK:');
        console.error(`\n  ${autoIndexLink}\n`);
      } else {
        console.error('🔗 FIREBASE INDEXES PAGE:');
        console.error(`\n  ${autoIndexLink}\n`);
      }

      console.error('='.repeat(80) + '\n');

      const queryMetadata = {
        collection: 'members',
        where: [],
        orderBy: [],
        pagination: 'none',
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
          message: 'An index is required for this operation.',
        },
        { status: 503 }
      );
    }

    console.error(
      `DELETE /api/households/members error:`,
      queryError
    );
    return NextResponse.json(
      { error: 'Failed to delete member' },
      { status: 500 }
    );
  }
}
