/**
 * LUWAS Firestore Composite Indexes - Complete Reference
 * 
 * This document maps all queries in the LUWAS application to their required
 * Firestore composite indexes. Indexes are organized by collection and purpose.
 * 
 * Status: PARTIALLY CREATED (Households indexes exist, Report/Member indexes needed)
 */

// ============================================================================
// COLLECTION: households
// ============================================================================
// Status: ✅ ALL INDEXES CREATED

/**
 * HOUSEHOLDS INDEX 1: totalPWDs, headLastName, __name__
 * 
 * Used by: GET /api/households?sort=totalPWDs&order=asc|desc
 * Query Pattern:
 *   - No where clause (Personnel/Admin view all barangays)
 *   - orderBy('totalPWDs', order)
 *   - orderBy('headLastName', 'asc')
 * 
 * API: GET /api/households?sort=totalPWDs&order=asc
 * Route: app/api/households/route.js
 */

/**
 * HOUSEHOLDS INDEX 2: hasMapLocation, headLastName, __name__
 * 
 * Used by: GET /api/households?sort=hasMapLocation&order=asc|desc
 * Query Pattern:
 *   - No where clause (Personnel/Admin view)
 *   - orderBy('hasMapLocation', order)
 *   - orderBy('headLastName', 'asc')
 * 
 * API: GET /api/households?sort=hasMapLocation&order=asc
 * Route: app/api/households/route.js
 */

/**
 * HOUSEHOLDS INDEX 3: headLastName, headFirstName, headMiddleName, headSuffix, __name__
 * 
 * Used by: GET /api/households (default sort)
 * Query Pattern:
 *   - No where clause
 *   - orderBy('headLastName', order)
 *   - orderBy('headFirstName', order)
 *   - orderBy('headMiddleName', order)
 *   - orderBy('headSuffix', order)
 * 
 * API: GET /api/households (default)
 * Route: app/api/households/route.js
 */

/**
 * HOUSEHOLDS INDEX 4: totalSeniors, headLastName, __name__
 * 
 * Used by: GET /api/households?sort=totalSeniors&order=asc|desc
 * Query Pattern:
 *   - No where clause
 *   - orderBy('totalSeniors', order)
 *   - orderBy('headLastName', 'asc')
 * 
 * API: GET /api/households?sort=totalSeniors&order=asc
 * Route: app/api/households/route.js
 */

/**
 * HOUSEHOLDS INDEX 5: barangay, totalPWDs, __name__
 * 
 * Used by: GET /api/households?sort=totalPWDs (Secretary filtered view)
 * Query Pattern:
 *   - where('barangay', '==', secretaryBarangay)
 *   - orderBy('totalPWDs', order)
 * 
 * API: GET /api/households?sort=totalPWDs (as Brgy-Secretary)
 * Route: app/api/households/route.js
 * Note: Secretary role automatically filters to their barangay
 */

/**
 * HOUSEHOLDS INDEX 6: barangay, headLastName, headFirstName, headMiddleName, headSuffix, __name__
 * 
 * Used by: GET /api/households (Secretary default sort)
 * Query Pattern:
 *   - where('barangay', '==', secretaryBarangay)
 *   - orderBy('headLastName', order)
 *   - orderBy('headFirstName', order)
 *   - orderBy('headMiddleName', order)
 *   - orderBy('headSuffix', order)
 * 
 * API: GET /api/households (as Brgy-Secretary)
 * Route: app/api/households/route.js
 */

/**
 * HOUSEHOLDS INDEX 7: barangay, totalSeniors, __name__
 * 
 * Used by: GET /api/households?sort=totalSeniors (Secretary filtered view)
 * Query Pattern:
 *   - where('barangay', '==', secretaryBarangay)
 *   - orderBy('totalSeniors', order)
 * 
 * API: GET /api/households?sort=totalSeniors (as Brgy-Secretary)
 * Route: app/api/households/route.js
 */


// ============================================================================
// COLLECTION: members (collectionGroup)
// ============================================================================
// Status: ❌ INDEXES NEEDED (Use collectionGroup to fetch from all households)

/**
 * MEMBERS INDEX 1: isPWD (Single-Field Index)
 * 
 * STATUS: ❌ NEEDS SINGLE-FIELD INDEX ENABLED
 * 
 * Used by: GET /api/reports/pwd
 * Query Pattern (in memberService.getAllPWDMembers):
 *   - collectionGroup('members')
 *   - where('isPWD', '==', true)
 * 
 * API Endpoint: GET /api/reports/pwd
 * Route: app/api/reports/pwd/route.js
 * Service: lib/api/memberService.js::getAllPWDMembers()
 * 
 * FIREBASE CONSOLE LINK:
 * https://console.firebase.google.com/u/2/project/luwasv2/firestore/databases/-default-/indexes
 * 
 * CREATION STEPS (Single-Field Index):
 * 1. Go to Firebase Console → Firestore → Indexes
 * 2. Go to "Single-field indexes" tab (not Composite)
 * 3. Find the "members" collection
 * 4. Find the "isPWD" field
 * 5. Toggle or enable "Ascending" or "Descending" index
 * 6. Wait for status: Creating → Enabled (usually instant or 1-2 min)
 * 
 * ALT: If field not in list, access from:
 * - Firestore Settings → Indexes
 * - Or run the query and Firestore will show the index configuration option
 * 
 * ERROR MESSAGE:
 * "Firestore composite index required"
 * Error Code: 9
 * "The query requires an index"
 */

/**
 * MEMBERS INDEX 2: isSeniorCitizen (Single-Field Index)
 * 
 * STATUS: ❌ NEEDS SINGLE-FIELD INDEX ENABLED
 * 
 * Used by: GET /api/reports/seniors
 * Query Pattern (in memberService.getAllSeniorMembers):
 *   - collectionGroup('members')
 *   - where('isSeniorCitizen', '==', true)
 * 
 * API Endpoint: GET /api/reports/seniors
 * Route: app/api/reports/seniors/route.js
 * Service: lib/api/memberService.js::getAllSeniorMembers()
 * 
 * FIREBASE CONSOLE LINK:
 * https://console.firebase.google.com/u/2/project/luwasv2/firestore/databases/-default-/indexes
 * 
 * CREATION STEPS (Single-Field Index):
 * 1. Go to Firebase Console → Firestore → Indexes
 * 2. Go to "Single-field indexes" tab (not Composite)
 * 3. Find the "members" collection
 * 4. Find the "isSeniorCitizen" field
 * 5. Toggle or enable "Ascending" or "Descending" index
 * 6. Wait for status: Creating → Enabled (usually instant or 1-2 min)
 * 
 * ALT: If field not in list, access from:
 * - Firestore Settings → Indexes
 * - Or run the query and Firestore will show the index configuration option
 * 
 * ERROR MESSAGE:
 * "Firestore composite index required"
 * Error Code: 9
 * "The query requires an index"
 */


// ============================================================================
// QUICK REFERENCE: Creating Indexes
// ============================================================================

/*
FIREBASE CONSOLE ACCESS:
https://console.firebase.google.com/u/2/project/luwasv2/firestore/databases/-default-/indexes

STEPS TO ENABLE SINGLE-FIELD INDEX:

1. Open Firebase Console
2. Navigate to: Firestore → Indexes
3. Go to "Single-field indexes" tab
4. Find your collection (members)
5. Find the field (isPWD or isSeniorCitizen)
6. Toggle "Ascending" or "Descending" to enable
7. Wait for status: Creating → Enabled (usually instant or 1-2 min)

NOTE:
- These are single-field indexes, not composite
- Firestore actually needs a manual index entry for collectionGroup queries
- Use the single-field index controls section in Firebase Console
- Not the "Create Index" button (that's for composite indexes)
*/


// ============================================================================
// API ENDPOINTS AND THEIR QUERIES
// ============================================================================

/*
HOUSEHOLD QUERIES:
- GET /api/households
  Status: ✅ Working (indexes 1-7 created)
  Queries: Multiple sort fields with/without barangay filter
  
REPORT QUERIES:
- GET /api/reports/pwd
  Status: ❌ MISSING INDEX
  Query: members collectionGroup where isPWD == true
  Error: Code 9 / FAILED_PRECONDITION
  
- GET /api/reports/seniors
  Status: ❌ MISSING INDEX
  Query: members collectionGroup where isSeniorCitizen == true
  Error: Code 9 / FAILED_PRECONDITION

TEST ENDPOINTS (to verify after index creation):
- GET /api/test-composite-index
  Tests: households query (should pass ✅)
  
- GET /api/test-pwd-index
  Tests: PWD members query (currently fails ❌)
  
- GET /api/test-seniors-index
  Tests: Seniors members query (currently fails ❌)
*/


// ============================================================================
// ERROR HANDLING FLOW
// ============================================================================

/*
When a query fails due to missing composite index:

1. QUERY EXECUTION
   - API endpoint runs query
   - Firestore rejects with error code 9 (FAILED_PRECONDITION)
   
2. ERROR CAPTURE
   - Try/catch block catches error
   - lib/api/firestoreErrorHandler.js analyzes error
   - Extracts Firebase Console link from error message
   - Normalizes URL (removes /u/<number>/)
   
3. ERROR RESPONSE
   - Returns 503 status
   - Includes:
     * error: "Firestore composite index required"
     * errorCode: 9
     * consoleLink: Firebase Console URL
     * explanation: Why index is needed
     * actionSteps: Step-by-step guide
     * nextSteps: Checklist to follow
     
4. DEVELOPER/USER ACTION
   - Reads error response or terminal logs
   - Clicks consoleLink
   - Firebase Console opens with index creation form pre-filled
   - Creates index
   - Waits 2-5 minutes
   - Retries API endpoint
   
5. SUCCESS
   - Query now succeeds
   - API returns 200 with data
   - Feature fully operational
*/


// ============================================================================
// SUMMARY & ACTION ITEMS
// ============================================================================

/*
COMPLETED:
✅ Households indexes (1-7) - All created and working
✅ Error handling infrastructure - Captures, analyzes, returns consoleLink
✅ URL normalization - Removes /u/<number>/ for cross-account access
✅ Test endpoints - Can verify queries without affecting production

TO DO:
❌ Enable single-field index for isPWD field (on members collection)
❌ Enable single-field index for isSeniorCitizen field (on members collection)

After enabling these 2 single-field indexes:
✅ /api/reports/pwd endpoint will work
✅ /api/reports/seniors endpoint will work
✅ Full Reports module will be operational

TESTING WORKFLOW:
1. Enable isPWD single-field index in Firebase Console
2. Test: GET /api/test-pwd-index → should return 200
3. Enable isSeniorCitizen single-field index in Firebase Console
4. Test: GET /api/test-seniors-index → should return 200
5. Access /reports page → should load data successfully

Firebase Console: https://console.firebase.google.com/u/2/project/luwasv2/firestore/databases/-default-/indexes
Go to "Single-field indexes" tab (not Composite - these are simple field queries on collectionGroup)
*/
