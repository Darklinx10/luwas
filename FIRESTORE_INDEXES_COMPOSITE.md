/**
 * Firestore Composite Indexes - Households Collection
 * This document maps enabled indexes to their query patterns
 */

// ENABLED INDEXES:

// Index 1: totalPWDs, headLastName, __name__
// Query: GET /api/households?sort=totalPWDs&order=asc
// Pattern: .orderBy('totalPWDs', order).orderBy('headLastName', 'asc')
// No barangay filter

// Index 2: hasMapLocation, headLastName, __name__
// Query: GET /api/households?sort=hasMapLocation&order=asc
// Pattern: .orderBy('hasMapLocation', order).orderBy('headLastName', 'asc')
// No barangay filter

// Index 3: headLastName, headFirstName, headMiddleName, headSuffix, __name__
// Query: GET /api/households?sort=headLastName (default)
// Pattern: .orderBy('headLastName', order)
//          .orderBy('headFirstName', order)
//          .orderBy('headMiddleName', order)
//          .orderBy('headSuffix', order)
// No barangay filter

// Index 4: totalSeniors, headLastName, __name__
// Query: GET /api/households?sort=totalSeniors&order=asc
// Pattern: .orderBy('totalSeniors', order).orderBy('headLastName', 'asc')
// No barangay filter

// Index 5: barangay, totalPWDs, __name__
// Query: GET /api/households?sort=totalPWDs&order=asc (as Secretary/Admin viewing their barangay)
// Pattern: .where('barangay', '==', value)
//          .orderBy('totalPWDs', order)
// Note: Contains barangay but no headLastName - Firestore handles the __name__ tiebreaker

// Index 6: barangay, headLastName, headFirstName, headMiddleName, headSuffix, __name__
// Query: GET /api/households (default, as Secretary/Admin)
// Pattern: .where('barangay', '==', value)
//          .orderBy('headLastName', order)
//          .orderBy('headFirstName', order)
//          .orderBy('headMiddleName', order)
//          .orderBy('headSuffix', order)

// Index 7: barangay, totalSeniors, __name__
// Query: GET /api/households?sort=totalSeniors&order=asc (as Secretary/Admin)
// Pattern: .where('barangay', '==', value)
//          .orderBy('totalSeniors', order)
// Note: Contains barangay but no headLastName - Firestore handles the __name__ tiebreaker

// IMPORTANT NOTES:
// - __name__ field (document ID) is automatically used by Firestore for final tiebreaking
// - When sorting by totalPWDs, totalSeniors, or hasMapLocation with a barangay filter,
//   Firestore uses barangay + field + __name__ (Index 5 or 7)
// - Secretary barangay filtering prevents need for separate non-filtered queries in most cases
// - If search is used, the query fetches all matching docs and filters in-memory
