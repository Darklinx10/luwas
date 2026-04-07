/**
 * app/api/test-seniors-index/route.js
 *
 * Test endpoint for the current Seniors report query path.
 * The report is now household-driven, so it should no longer depend on
 * collectionGroup composite indexes on members.
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import { getAllSeniorMembers } from '@/lib/api/memberService';
import { analyzeFirestoreError } from '@/lib/api/firestoreErrorHandler';

export async function GET(request) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const members = await getAllSeniorMembers();

    return NextResponse.json({
      success: true,
      message: 'Seniors report query ran successfully',
      indexingStrategy: 'Household-driven report query; no collectionGroup composite index required',
      count: members.length,
      sample: members.slice(0, 3),
    });
  } catch (error) {
    if (error?.code === 9 || error?.message?.includes('FAILED_PRECONDITION')) {
      const queryMetadata = {
        collection: 'households',
        where: [],
        orderBy: [],
        pagination: 'offset',
      };

      const analysis = analyzeFirestoreError(error, queryMetadata);

      return NextResponse.json(
        {
          error: 'Firestore index required for Seniors report query',
          errorCode: error.code,
          isIndexError: true,
          explanation: analysis.explanation,
          queryFields: analysis.fields,
          suggestions: analysis.suggestions,
          actionSteps: analysis.actionSteps,
          ...(analysis.indexUrl && {
            consoleLink: analysis.indexUrl,
            details: `Create the required index here: ${analysis.indexUrl}`,
          }),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Seniors report query failed', message: error.message },
      { status: 500 }
    );
  }
}
