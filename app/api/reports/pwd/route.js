/**
 * app/api/reports/pwd/route.js
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
 * 
 * Auth required. Secretary gets only their barangay.
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import { adminDb } from '@/lib/firebaseAdmin';

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
    // Get all PWD members across all accessible households in ONE query
    let memberQuery = adminDb.collectionGroup('members').where('isPWD', '==', true);

    const memberSnap = await memberQuery.get();

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

    // Collect all PWD members across all accessible households
    const pwdMembers = [];
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

      pwdMembers.push({
        memberId: memDoc.id,
        householdId,
        firstName: member.firstName || '',
        middleName: member.middleName || '',
        lastName: member.lastName || '',
        fullName: member.fullName || '',
        age: member.age || null,
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
    pwdMembers.sort((a, b) => {
      const lastNameCmp = a.lastName.localeCompare(b.lastName);
      if (lastNameCmp !== 0) return lastNameCmp;
      return a.firstName.localeCompare(b.firstName);
    });

    // Paginate
    const totalCount = pwdMembers.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
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
