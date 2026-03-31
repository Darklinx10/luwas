/**
 * app/api/reports/pwd.js
 * 
 * GET /api/reports/pwd - Fetch PWD (Persons with Disability) members
 * 
 * Returns paginated list of all members with isPWD = true
 * Includes household information for context
 * 
 * Query params:
 * - page: Page number (1-based)
 * - limit: Results per page
 * - search: Search by member name
 * - barangay: Optional barangay filter (Secretary restricted to own)
 * 
 * Auth required. Secretary gets only their barangay.
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request) {
  // ✅ Verify authentication
  const user = await getSessionUser(request);
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
    const search = searchParams.get('search') || '';

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Fetch all households (filtered by barangay if Secretary)
    let householdQuery = adminDb.collection('households');

    if (user.role === 'Brgy-Secretary') {
      householdQuery = householdQuery.where('barangay', '==', user.barangay);
    }

    const householdSnap = await householdQuery.get();

    // Collect all PWD members across all accessible households
    const pwdMembers = [];

    for (const householdDoc of householdSnap.docs) {
      const household = householdDoc.data();
      const householdId = householdDoc.id;

      const membersSnap = await adminDb
        .collection('households')
        .doc(householdId)
        .collection('members')
        .where('isPWD', '==', true)
        .get();

      membersSnap.forEach((memDoc) => {
        const member = memDoc.data();

        // Apply search filter
        if (search) {
          const searchLower = search.toLowerCase();
          const memberName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();

          if (!memberName.includes(searchLower)) {
            return; // Skip this member
          }
        }

        pwdMembers.push({
          memberId: memDoc.id,
          householdId,
          firstName: member.firstName || '',
          lastName: member.lastName || '',
          age: member.age || null,
          sex: member.sex || '',
          barangay: household.barangay || '',
          headName: `${household.headFirstName || ''} ${household.headLastName || ''}`.trim(),
          disabilityType: member.disabilityType || '',
          createdAt: member.createdAt,
        });
      });
    }

    // Sort by last name
    pwdMembers.sort((a, b) => a.lastName.localeCompare(b.lastName));

    // Paginate
    const totalCount = pwdMembers.length;
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;
    const paginatedMembers = pwdMembers.slice(skip, skip + limit);

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
    console.error('GET /api/reports/pwd error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PWD report' },
      { status: 500 }
    );
  }
}
