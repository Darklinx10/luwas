/**
 * app/api/reports/pwd/route.js
 *
 * GET /api/reports/pwd
 * Fetch paginated PWD (Persons with Disability) member report
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 10, max: 100)
 * - search: Search term for filtering (optional)
 *
 * Returns:
 * - members: Array of PWD members with household context
 * - totalMembers: Total count of PWD members
 * - totalPages: Total number of pages
 * - currentPage: Current page number
 * - pageSize: Items per page
 *
 * Auth required. Secretary gets only their barangay data.
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import { getAllPWDMembers } from '@/lib/api/memberService';
import { extractFirestoreIndexUrl } from '@/lib/api/firestoreErrorHandler';

export async function GET(request) {
  console.log('👥 GET /api/reports/pwd called');

  // ✅ Verify authentication
  const user = await getSessionUser(request);
  if (!user) {
    console.log('❌ Unauthorized: No session user');
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required' },
      { status: 401 }
    );
  }

  // 🔐 Only Secretary and Personnel can view reports
  if (!['Brgy-Secretary', 'MDRRMC-Personnel'].includes(user.role)) {
    console.log(`❌ Forbidden: User role ${user.role} not allowed`);
    return NextResponse.json(
      { error: 'Forbidden: Report access required' },
      { status: 403 }
    );
  }

  try {
    // Parse query parameters
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10)));
    const search = String(url.searchParams.get('search') || '').trim();

    // Determine barangay filter for Secretary role
    let barangay = null;
    if (user.role === 'Brgy-Secretary') {
      barangay = user.barangay || null;
      if (!barangay) {
        console.log('⚠️ Secretary without barangay assignment');
        return NextResponse.json(
          { error: 'Secretary role requires barangay assignment' },
          { status: 400 }
        );
      }
      console.log(`🏘️ Fetching PWD members for Secretary in barangay: ${barangay}`);
    } else {
      console.log('👮 Fetching PWD members for Personnel (all barangays)');
    }

    // Fetch all PWD members (with optional barangay filter)
    console.log(`📡 Querying PWD members from memberService...`);
    const allMembers = await getAllPWDMembers({ barangay });
    console.log(`✅ Retrieved ${allMembers.length} PWD members`);

    // Apply search filter if provided
    let filteredMembers = allMembers;
    if (search) {
      console.log(`🔍 Applying search filter: "${search}"`);
      const lowerSearch = search.toLowerCase();
      filteredMembers = allMembers.filter((member) => {
        const firstName = String(member.firstName || '').toLowerCase();
        const middleName = String(member.middleName || '').toLowerCase();
        const lastName = String(member.lastName || '').toLowerCase();
        const fullName = String(member.fullName || '').toLowerCase();
        const householdHead = String(member.headFullName || '').toLowerCase();
        const barangayMatch = String(member.householdBarangay || '').toLowerCase();
        const sitioMatch = String(member.householdSitio || '').toLowerCase();
        const contactMatch = String(member.contactNumber || '').toLowerCase();
        const householdIdMatch = String(member.householdId || '').toLowerCase();

        return (
          firstName.includes(lowerSearch) ||
          middleName.includes(lowerSearch) ||
          lastName.includes(lowerSearch) ||
          fullName.includes(lowerSearch) ||
          householdHead.includes(lowerSearch) ||
          barangayMatch.includes(lowerSearch) ||
          sitioMatch.includes(lowerSearch) ||
          contactMatch.includes(lowerSearch) ||
          householdIdMatch.includes(lowerSearch)
        );
      });
      console.log(`✅ Search filter returned ${filteredMembers.length} members`);
    }

    // Calculate pagination
    const totalMembers = filteredMembers.length;
    const totalPages = Math.max(1, Math.ceil(totalMembers / limit));
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

    console.log(
      `📄 Pagination: page ${page}/${totalPages}, showing ${paginatedMembers.length}/${totalMembers} members`
    );

    return NextResponse.json({
      success: true,
      members: paginatedMembers,
      totalMembers,
      totalPages,
      currentPage: page,
      pageSize: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      isIndexError: false,
    });
  } catch (error) {
    console.error('❌ PWD Report Error:', error.message);

    // Intelligent error handling for Firestore composite index errors
    const isMissingIndex = error?.code === 9 || error?.message?.includes('FAILED_PRECONDITION');
    if (isMissingIndex) {
      const consoleLink = extractFirestoreIndexUrl(error);
      console.log('Extracted Firestore index URL:', consoleLink);

      return NextResponse.json(
        {
          error: 'Firestore composite index required',
          errorCode: error.code || 9,
          isIndexError: true,
          consoleLink,
          message: 'A Firestore index is required for this query.',
          details: consoleLink
            ? 'Click the link to open Firebase Console and create the required index.'
            : 'Missing index detected, but no auto-generated console link was found in the error message.',
        },
        { status: 503 }
      );
    }

    // Other errors
    console.error(
      `GET /api/reports/pwd error:`,
      error
    );
    return NextResponse.json(
      { error: 'Failed to fetch PWD report' },
      { status: 500 }
    );
  }
}
