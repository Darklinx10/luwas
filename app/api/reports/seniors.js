/**
 * app/api/reports/seniors.js
 * 
 * GET /api/reports/seniors - Fetch Senior Citizens (age >= 60)
 * 
 * Returns paginated list of all members with age >= 60
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

    // Collect all senior members across all accessible households
    const seniorMembers = [];

    for (const householdDoc of householdSnap.docs) {
      const household = householdDoc.data();
      const householdId = householdDoc.id;

      const membersSnap = await adminDb
        .collection('households')
        .doc(householdId)
        .collection('members')
        .get();

      membersSnap.forEach((memDoc) => {
        const member = memDoc.data();
        const age = parseInt(member.age, 10);

        // Filter seniors (age >= 60)
        if (isNaN(age) || age < 60) {
          return; // Skip non-seniors
        }

        // Apply search filter
        if (search) {
          const searchLower = search.toLowerCase();
          const memberName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();

          if (!memberName.includes(searchLower)) {
            return; // Skip this member
          }
        }

        seniorMembers.push({
          memberId: memDoc.id,
          householdId,
          firstName: member.firstName || '',
          lastName: member.lastName || '',
          age,
          sex: member.sex || '',
          barangay: household.barangay || '',
          headName: `${household.headFirstName || ''} ${household.headLastName || ''}`.trim(),
          birthdate: member.birthdate || '',
          healthConditions: member.healthConditions || '',
          createdAt: member.createdAt,
        });
      });
    }

    // Sort by last name
    seniorMembers.sort((a, b) => a.lastName.localeCompare(b.lastName));

    // Paginate
    const totalCount = seniorMembers.length;
    const totalPages = Math.ceil(totalCount / limit);
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
    return NextResponse.json(
      { error: 'Failed to fetch seniors report' },
      { status: 500 }
    );
  }
}
