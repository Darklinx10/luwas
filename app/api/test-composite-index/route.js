/**
 * app/api/test-composite-index/route.js
 *
 * Test endpoint to trigger a missing composite index error
 * This demonstrates the Firebase workflow:
 * 1. Run query normally
 * 2. Firestore fails with missing index error
 * 3. Error includes Firebase Console link
 * 4. Our error handler extracts and normalizes the link
 * 5. API returns consoleLink in error response
 *
 * GET /api/test-composite-index
 * Triggers household query with:
 * - where: barangay == "test"
 * - where: totalSeniors > 0
 * - orderBy: totalSeniors desc
 *
 * This requires a composite index and will fail if not created.
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import { fetchHouseholdsQuery } from '@/lib/api/householdService';
import { analyzeFirestoreError } from '@/lib/api/firestoreErrorHandler';

export async function GET(request) {
    console.log('🧪 GET /api/test-composite-index called - Testing missing index error handling');

    // Verify authentication
    const user = await getSessionUser(request);
    if (!user) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        console.log('📡 Running test query: households with barangay filter + totalSeniors > 0 + orderBy...');

        // This query requires a composite index and will fail if not created
        const result = await fetchHouseholdsQuery(
            'barangay',  // sort field
            'asc',       // sort order
            1,           // page
            10,          // limit
            'Bunga',     // barangay filter (test value)
            ''           // search
        );

        console.log('✅ Query succeeded! Composite index exists.');
        return NextResponse.json({
            success: true,
            message: 'Query ran successfully - composite index is already created',
            households: result.data,
        });
    } catch (error) {
        console.error('❌ Test Query Error:', error.message);

        // Check if this is a missing composite index error
        if (error?.code === 9 || error?.message?.includes('FAILED_PRECONDITION')) {
            console.error('\n🔍 Detected FIRESTORE COMPOSITE INDEX ERROR');
            console.error('This is expected - the index does not exist yet.');
            console.error('\n📋 Analyzing error and extracting console link...\n');

            const queryMetadata = {
                collection: 'households',
                where: [
                    { field: 'barangay', operator: '==', value: 'Bunga' },
                    { field: 'totalSeniors', operator: '>', value: 0 },
                ],
                orderBy: [
                    { field: 'totalSeniors', direction: 'desc' },
                ],
                pagination: 'offset',
            };

            const analysis = analyzeFirestoreError(error, queryMetadata);

            console.error('📊 Query Analysis:');
            console.error('  Collection:', queryMetadata.collection);
            console.error('  Filters:', queryMetadata.where.map(w => `${w.field} ${w.operator} ${w.value}`).join(' AND '));
            console.error('  OrderBy:', queryMetadata.orderBy.map(o => `${o.field} (${o.direction})`).join(', '));
            console.error('\n🔗 Firebase Console Link (Normalized):');
            console.error(`  ${analysis.indexUrl || 'Not found'}`);
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
                    message: 'Please follow the action steps or click consoleLink to create the required Firestore composite index.',
                    nextSteps: [
                        '1. Click the consoleLink or open the URL in your browser',
                        '2. Firebase Console will show the missing index configuration',
                        '3. Click "Create Index" to start building the index',
                        '4. Wait 2-5 minutes for the index to be created',
                        '5. Retry this endpoint - the query should succeed',
                    ],
                },
                { status: 503 }
            );
        }

        // Other errors
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
        });

        return NextResponse.json(
            {
                error: 'Query failed',
                message: error.message || 'Unknown error',
                details: error.details || null,
            },
            { status: 500 }
        );
    }
}
