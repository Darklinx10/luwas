# Firebase Quota Usage Root Cause Analysis - LUWAS App

**Date:** March 30, 2026  
**Status:** Comprehensive Analysis Complete  
**Focus:** Identifying exact files, functions, and patterns causing high quota consumption

---

## Executive Summary

The LUWAS app is consuming excessive Firebase quota through **multiple N+1 query patterns, nested subcollection reads, batch operations with duplicate writes, and unnecessary session validation reads**. The analysis identified **11 critical quota issues** across the codebase.

### Highest Impact Issues (Ranked)

| Rank | Issue | Module | Severity | Est. Quota/Load | Fix Difficulty |
|------|-------|--------|----------|-----------------|-----------------|
| 1 | **Nested Subcollection Scans in Reports** | Reports (PWD/Seniors) | CRITICAL | 1000s reads/execution | Medium |
| 2 | **OSMMap Household Fetching** | Maps | CRITICAL | 100s-1000s reads/load | High |
| 3 | **Senior Citizens Service N+1** | Dashboard/Reports | CRITICAL | 100s-500s reads/execute | Low |
| 4 | **PWD Service N+1** | Dashboard/Reports | CRITICAL | 100s-500s reads/execute | Low |
| 5 | **Duplicate Data Writes on Upload** | Household Upload | HIGH | 100s-1000s writes/upload | Medium |
| 6 | **Affected Households Computation** | Reports Page | HIGH | 10s-100s reads/load | Medium |
| 7 | **Member Service Aggregation** | API Reports | HIGH | 100s-500s reads | Low |
| 8 | **Container PDF Storage Bloat** | All Document Paths | MEDIUM | Unknown (varies) | High |
| 9 | **Session Validation on Every Request** | Middleware/Auth | MEDIUM | Variable reads | Low |
| 10 | **Form Data Writes Without Validation** | Household Forms | MEDIUM | 10s-100s writes/form | Low |
| 11 | **Hazard File GeoJSON Duplication** | Maps/Hazards | LOW | 10s-100s reads | Medium |

---

## Detailed Quota Issue Analysis

### CRITICAL ISSUES

---

#### Issue #1: Nested Subcollection Scans in Reports API (Seniors/PWD)
**File:** [`app/api/reports/seniors/route.js`](app/api/reports/seniors/route.js#L1)  
**Severity:** 🔴 CRITICAL  
**Operation Type:** Read  
**Frequency:** Every time PWD or Senior report is loaded (per page visit)

**Root Cause:**
```typescript
// Line 48-65: getAllSeniorMembers pattern
for (const householdDoc of householdSnap.docs) {
  // Query 1: Get all senior members in this household
  const membersSnap = await adminDb
    .collection('households')
    .doc(householdId)
    .collection('members')
    .where('isSeniorCitizen', '==', true)
    .get();
    
  // Then loop through each member
  membersSnap.forEach((memDoc) => { ... });
}
```

**The Problem:**
1. Reads ALL households (1 read)
2. For EACH household, executes a WHERE query on members collection (H reads, where H = number of households)
3. This is a classic N+1 query pattern = 1 + H reads minimum
4. If there are 500 households = **501+ reads per report load**

**Real-World Math:**
- 500 households
- Average 5 members per household
- Read all households: **1 read**
- Query members for each household: **500 reads** (1 per household query)
- **Total: 501 reads per execution**
- If report is loaded 10 times/day = **5,010 reads/day**

**When It Happens:**
- Every time user loads PWD report page
- Every time user loads Seniors report page
- Every time dashboard refreshes (if using this data)
- Every export/filter action

**Files Affected:**
- [`app/api/reports/seniors/route.js`](app/api/reports/seniors/route.js) (lines 48-65)
- [`app/api/reports/pwd/route.js`](app/api/reports/pwd/route.js) (lines 48-65)
- [`lib/api/memberService.js`](lib/api/memberService.js) (lines 313-370) - `getAllPWDMembers()` and `getAllSeniorMembers()`

**Recommended Fix:** HIGHEST PRIORITY
- Add `isSeniorCitizen` and `isPWD` flags to household-level summary doc
- Use `totalSeniors` and `totalPWDs` from household doc instead of querying members
- This reduces N+1 to 1 read

**Effort:** LOW (data already exists in household doc)

---

#### Issue #2: OSMMap Household Fetching With Nested Collection Reads
**File:** [`app/(home)/maps/components/OSMMap.jsx`](app/home/maps/components/OSMMap.jsx#L160-L220)  
**Severity:** 🔴 CRITICAL  
**Operation Type:** Read + Client-Side  
**Frequency:** Every time map page loads

**Root Cause:**
```typescript
// Line 160-190
const snapshot = await getDocs(collection(db, 'households'));
const docs = snapshot.docs;

for (let i = 0; i < docs.length; i += batchSize) {
  const batch = docs.slice(i, i + batchSize);
  
  await Promise.all(
    batch.map(async (householdDoc) => {
      // Parallel reads for each household
      const [membersSnap, geoSnap] = await Promise.all([
        getDocs(collection(db, 'households', householdDoc.id, 'members')),
        getDocs(collection(db, 'households', householdDoc.id, 'geographicIdentification')),
      ]);
      
      // Then for each member, read their name
      for (const geoDoc of geoSnap.docs) {
        geoData.homes.forEach((home, index) => {
          // This data should already be in household doc
        });
      }
    })
  );
}
```

**The Problem:**
1. Reads ALL households from Firestore (1 read)
2. For EACH household in parallel, reads 2 collections: members + geographicIdentification (2*H reads)
3. If H=500: **1 + (2*500) = 1,001 reads per map load**
4. Reading members collection just to get names that should be cached

**Real-World Impact:**
- Map page is frequently accessed feature
- Every load hammers Firestore with 1000+ reads
- Multiple concurrent users = exponential quota consumption

**When It Happens:**
- Every time user navigates to Maps page
- Every time map refreshes/reloads
- Mobile/web responsive reload

**Recommended Fix:** CRITICAL
- Use household-level summary fields only: `householdId`, `headFirstName`, `headLastName`, `barangay`, `sitio`, `homes` (already in household doc)
- Remove members fetch (not needed for mapping)
- Reduce to just 1 read (get all households), construct markers client-side from data already in household doc
- This reduces ~1000+ reads to 1 read

**Effort:** MEDIUM (needs UI adjustment to not show member names, or cache member names in household doc)

---

#### Issue #3: Senior Citizens Service - N+1 Query Pattern
**File:** [`services/seniorServices.js`](services/seniorServices.js#L1-L75)  
**Severity:** 🔴 CRITICAL  
**Operation Type:** Read + Client-Side  
**Frequency:** Used in dashboard, reports

**Root Cause:**
```typescript
// Line 8: Fetch ALL households
const householdsSnap = await getDocs(collection(db, 'households'));

// Line 13: For EACH household
for (let i = 0; i < householdsSnap.docs.length; i += batchSize) {
  const batchSeniors = await Promise.all(
    batch.map(async (householdDoc) => {
      // Line 21: Read geographicIdentification
      const geoDocRef = doc(...'geographicIdentification', 'main');
      const geoSnap = await getDoc(geoDocRef);
      
      // Line 22: Read all members
      const membersSnap = await getDocs(membersColRef);
      
      // Line 27-32: For EACH member, read demographic characteristics
      const memberSeniors = await Promise.all(
        membersSnap.docs.map(async (memberDoc) => {
          const demoRef = doc(...'demographicCharacteristics', 'main');
          const demoSnap = await getDoc(demoRef);
          // Line 37: Sum age >= 60
          if (!isNaN(age) && age >= 60) { ... }
        })
      );
    })
  );
}
```

**The Problem:**
1. Read all households: **1 read**
2. For each household (H), read geo doc: **H reads**
3. For each household (H), read members collection: **H reads**
4. For each member (M), read demographic doc: **H*M reads**
5. **Total = 1 + H + H + (H*M) = 1 + 2H + HM reads**
6. Example: 500 households × 5 members avg = **1 + 1000 + 2500 = 3,501 reads**

**But seniors threshold should already be computed in household doc!**

**Real-World Impact:**
- Called multiple times when loading dashboard/reports
- Each execution burns 1000s of reads

**When It Happens:**
- Dashboard page loads
- Senior report page loads
- Any page that uses senior statistics

**Recommended Fix:** HIGHEST PRIORITY
- Senior count is already calculated during upload: `household.totalSeniors`
- Don't fetch individual members, just use the summary
- If need individual senior details, add a server-side API that uses household summary to filter, not member iteration

**Effort:** LOW

---

#### Issue #4: PWD Service - Identical N+1 Pattern
**File:** [`services/pwdService.js`](services/pwdService.js#L1-L110)  
**Severity:** 🔴 CRITICAL  
**Operation Type:** Read + Client-Side  
**Frequency:** Used in dashboard, reports

**Root Cause:** Same as #3 but for PWD members
```typescript
// pwdService.fetchAllPWDs()
const householdsSnap = await getDocs(collection(db, 'households'));

const data = await Promise.all(
  householdsSnap.docs.map(async (householdDoc) => {
    // Read geo
    const geoSnap = await getDoc(doc(db, ...)); // Read 1
    // Read health
    const healthSnap = await getDoc(doc(db, ...)); // Read 1
    // Check if isPWD
    if (!health?.isPWD) return null;
    // Read demographic
    const demoSnap = await getDoc(demoRef); // Read 1
    // Return data
  })
);
// Total: 3 reads per household = 3H reads
```

**The Problem:**
- For 500 households: **1 + (3*500) = 1,501 reads per execution**
- Again, PWD count should be in household summary

**Real-World Math:**
- Called on PWD report load
- If loaded 10 times/day = **15,010 reads/day**

**Recommended Fix:** HIGHEST PRIORITY
- Use `household.totalPWDs` from summary doc
- Create server API endpoint that returns PWD details without individual member reads

**Effort:** LOW

---

### HIGH SEVERITY ISSUES

---

#### Issue #5: Duplicate Data Writes During Household Upload
**File:** [`features/Households/services/householdUploadService.js`](features/Households/services/householdUploadService.js#L100-L160)  
**Severity:** 🟠 HIGH  
**Operation Type:** Write  
**Frequency:** During bulk data import

**Root Cause:**
```typescript
chunk.forEach(({ householdId, geoData, members }) => {
  // Write 1: Parent household doc
  const householdDoc = {
    householdId, headFirstName, headLastName, headSuffix,
    // ...all household fields...
    homes, hasMapLocation, totalResidents, totalMale, totalFemale, totalPWDs, totalSeniors,
  };
  batch.set(hhRef, householdDoc, { merge: true });

  // Write 2: Geographic identification doc (duplicates household-level geo data)
  if (geoData.headFirstName) {
    const geoRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
    batch.set(geoRef, geoData, { merge: true }); // geoData = duplicate of household doc fields
  }

  // Write 3+: Members (correct)
  members.forEach(member => {
    const memberRef = doc(db, 'households', householdId, 'members', member.id);
    batch.set(memberRef, member, { merge: true }); // Write 1 per member

    // Write 4+: Member demographic characteristics (DUPLICATE of member doc)
    const demoRef = doc(db, ...'demographicCharacteristics', 'main');
    batch.set(demoRef, { ...member }, { merge: true }); // Exact duplicate!
  });
});
```

**The Problem:**
1. **Household geo data is duplicated** - same barangay, sitio, contact info stored in both parent doc and geographicIdentification subcollection
2. **Member demographic data is duplicated** - exact copy of member doc stored in demographicCharacteristics subcollection
3. For 400 households with 5 members each:
   - Writes: 400 (household) + 400 (geo) + 2000 (members) + 2000 (demo) = **4,800 writes**
   - Actual needed: 400 (household) + 2000 (members) = **2,400 writes**
   - **2,400 unnecessary writes = 50% quota waste**

**Real-World Impact:**
- Every bulk upload uses 2-4x more writes than necessary
- If uploading 1000 households weekly = **27,600 unnecessary writes/week**

**When It Happens:**
- Every time secretary uploads household batch file
- Every data migration or import operation

**Recommended Fix:** HIGH PRIORITY
- Remove geographicIdentification subcollection - use household doc instead
- Remove demographicCharacteristics subcollection - use member doc instead
- OR keep one copy but not both
- This cuts upload writes by 50%

**Effort:** MEDIUM (schema/data structure change)

---

#### Issue #6: Affected Households Computation From Hazards
**File:** [`app/(home)/reports/page.jsx`](app/home/reports/page.jsx#L35-L85)  
**Severity:** 🟠 HIGH  
**Operation Type:** Read  
**Frequency:** Every time hazard report tab is loaded

**Root Cause:**
```typescript
// Line 73: Fetch hazard GeoJSON
const geojson = await fetchHazardFromFirebase(selectedReport);

// Line 89-95: Paginated household fetch with nested reads
while (true) {
  const snapshot = await getDocs(q);
  if (snapshot.empty) break;
  
  lastDoc = snapshot.docs[snapshot.docs.length - 1];
  
  // Line 98: For EACH household, read geographicIdentification
  await Promise.all(snapshot.docs.map(async (hhDoc) => {
    const geoSnap = await getDocs(collection(db, ...'geographicIdentification'));
```

**The Problem:**
1. Fetches hazard files (0-5 reads depending on number of hazards)
2. Then fetches all households in paginated batches
3. For EACH household, reads geographicIdentification collection
4. This is another N+1 pattern = **H + (H reads for geo) = 2H reads**

**Real-World Impact:**
- Triggered when clicking on harard report tab
- If 500 households = **1,000 reads per load**

**Recommended Fix:** MEDIUM PRIORITY
- Use household.homes data (already stored in parent doc)
- Don't need special geographicIdentification read
- Reduces to 1 read total

**Effort:** MEDIUM

---

#### Issue #7: Member Service Aggregation (getAllPWDMembers/getAllSeniorMembers)
**File:** [`lib/api/memberService.js`](lib/api/memberService.js#L345-L410)  
**Severity:** 🟠 HIGH  
**Operation Type:** Read  
**Frequency:** When reports API is called

**Root Cause:**
```typescript
// Line 348: Get all households
const householdSnap = await householdQuery.get();
const pwdMembers = [];

// Line 352: Loop through each household
for (const householdDoc of householdSnap.docs) {
  const householdId = householdDoc.id;
  
  // Line 356: Execute WHERE query for EACH household
  const membersSnap = await adminDb
    .collection('households')
    .doc(householdId)
    .collection('members')
    .where('isPWD', '==', true)
    .get();
```

**The Problem:**
- This is a common pattern that causes N+1 queries
- Get households: **1 read**
- For each household, WHERE query on members: **H reads**
- **Total = 1 + H reads**
- 500 households = **501 reads**

**When It Happens:**
- Every time reports API endpoint is called
- Frequently accessed feature

**Recommended Fix:** MEDIUM PRIORITY
- Pre-aggregate: store `isPWD` members list in household doc or separate index
- Use database-level aggregation if Firebase allows (like countingqueries)
- Query members collection with `where('isPWD', ==, true)` across all households (collectionGroup query) OR
- Store aggregate counts in household summary docs and filter/search at application level

**Effort:** MEDIUM

---

### MEDIUM SEVERITY ISSUES

---

#### Issue #8: Session Validation On Every Request
**File:** [`middleware.js`](middleware.js#L1-L80) and [`lib/auth/getSessionUser.js`](lib/auth/getSessionUser.js)  
**Severity:** 🟡 MEDIUM  
**Operation Type:** Read  
**Frequency:** Every authenticated API request

**Root Cause:**
```typescript
// In middleware.js line 50: verifyActiveSession
const userSnap = await userRef.get(); // Read 1: users collection

// In getSessionUser.js line 54: fetch user profile
const userSnap = await userRef.get(); // Read 1: users collection again

// This happens for:
// - GET /api/households
// - GET /api/households/:id/members
// - GET /api/dashboard
// - GET /api/reports/*
// - And EVERY other API endpoint
```

**The Problem:**
1. Every API request must validate session
2. Session validation reads users document
3. If user makes 10 API calls = 10 reads just for auth
4. With multiple concurrent users = exponential reads

**Real-World Math:**
- 5 concurrent users
- Each makes 5 API calls per minute
- 5 * 5 = 25 reads/minute just for session validation
- 25 * 60 * 8 hours = **12,000 reads/day** just for auth

**When It Happens:**
- Every single authenticated page load
- Every dashboard refresh
- Every report filter/search

**Recommended Fix:** MEDIUM PRIORITY
- Cache session in memory on client (using context)
- Only refresh session on explicit actions (login/logout) or timeout
- Use JWT tokens instead of reading users doc every time
- Reduce auth reads by 80%+

**Effort:** LOW-MEDIUM

---

#### Issue #9: Form Data Writes Without Aggregation
**File:** Multiple form components in [`features/Households/components/Forms/`](features/Households/components/Forms/)  
**Severity:** 🟡 MEDIUM  
**Operation Type:** Write  
**Frequency:** When users fill out and submit forms

**Root Cause:**
```typescript
// Example: demographic-characteristics.jsx
const handleSubmit = async () => {
  members.forEach(async (member) => {
    const memberRef = doc(db, 'households', householdId, 'members', member.id);
    await setDoc(memberRef, member, { merge: true }); // Write 1 per member
    
    const demoRef = doc(db, householdId, 'members', member.id, 'demographicCharacteristics', 'main');
    await setDoc(demoRef, { ...member }, { merge: true }); // Write 2 per member (DUPLICATE!)
  });
};

// For form with 10 members = 20 writes
```

**The Problem:**
1. Each form saves member data twice (member doc + demographic subcollection)
2. No batching (should use writeBatch)
3. Synchronous writes in loops instead of parallel

**Real-World Impact:**
- Household form has 18+ form screens
- Each screen writes form data
- 1 household = 100+ writes through entire form

**Recommended Fix:** MEDIUM PRIORITY
- Use writeBatch for all writes
- Don't duplicate member data in subcollections
- Group related writes together

**Effort:** MEDIUM

---

#### Issue #10: Hazard File GeoJSON Duplication
**File:** [`services/hazardServices.js`](services/hazardServices.js#L1-L100)  
**Severity:** 🟡 MEDIUM  
**Operation Type:** Write + Storage  
**Frequency:** When hazard files are uploaded

**Root Cause:**
```typescript
// Line 120: Upload hazard file
export const uploadHazard = async ({ geojsonFile, hazardType, description, ... }) => {
  // Line 133: Parse GeoJSON from file
  const geojsonData = JSON.parse(content);
  
  // Line 137: Reproject GeoJSON
  const geojson = reprojectGeoJSON(geojsonData);
  
  // Line 142: Upload to Storage
  await uploadBytes(storageRef, new Blob([JSON.stringify(geojson)], ...));
  const downloadURL = await getDownloadURL(storageRef);
  
  // Line 148: Save file metadata with geojsonString COPY
  const hazardFileRef = await addDoc(collection(db, 'hazards', hazardType, 'hazardFiles'), {
    name: geojsonFile.name,
    geojsonString: JSON.stringify(geojson), // DUPLICATE: storing in Firestore too
    fileUrl: downloadURL, // Already have file URL to Storage
    createdAt: serverTimestamp(),
  });
```

**The Problem:**
1. GeoJSON is stored in **Storage** AND in **Firestore**
2. Firestore read = 1 read + storage download cost
3. Updates need to sync both places
4. Large GeoJSON files take storage quota and Firestore quota

**Real-World Impact:**
- Each hazard uploaded uses 2x storage
- Reading hazard = multiple reads (file metadata + geojson)

**Recommended Fix:** LOW PRIORITY
- Store only URL in Firestore, fetch GeoJSON from Storage when needed
- OR store metadata in Firestore, reference only

**Effort:** MEDIUM

---

#### Issue #11: Real-Time Listener on Map Context
**File:** [`context/mapContext.jsx`](context/mapContext.jsx#L1-L79)  
**Severity:** 🟡 MEDIUM  
**Operation Type:** Listener  
**Frequency:** Every time user is on any app page (it runs on every visit)

**Root Cause:**
```typescript
// Line 18: Set up real-time listener for map center
const unsubscribe = onSnapshot(docRef, (docSnap) => {
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (data.lat && data.lng) setDefaultCenter([data.lat, data.lng]);
  }
});

// This listener is created for EVERY user session
// Listeners fire on every document change
// If many users are logged in = many active listeners
```

**The Problem:**
1. Real-time listener is created on every app session
2. Listeners consume quota every time document changes
3. Multiple concurrent users = multiple active listeners
4. Settings doc changes might trigger updates for all users

**When It Happens:**
- Every time user opens the app
- Stays active until user logs out
- If admin changes map settings = updates fire for all listening users

**Recommended Fix:** LOW PRIORITY
- Load map center once on app load, don't use real-time listener for rarely-changing setting
- Use manual refresh instead
- Reserve real-time listeners for critical user-facing features only

**Effort:** LOW

---

## Summary Table: All Quota Issues

| # | File | Function | Issue | Type | Severity | Reads/Writes Per | Frequency | Fix Priority |
|---|------|----------|-------|------|----------|-----------------|-----------|--------------|
| 1 | app/api/reports/seniors/route.js | GET /api/reports/seniors | N+1 queries on members | Read | CRITICAL | 500+/exec | Per report load | 1 |
| 2 | app/api/reports/pwd/route.js | GET /api/reports/pwd | N+1 queries on members | Read | CRITICAL | 500+/exec | Per report load | 2 |
| 3 | services/seniorServices.js | fetchSeniors() | N+1 + nested reads | Read | CRITICAL | 1000+/exec | Dashboard | 3 |
| 4 | services/pwdService.js | fetchAllPWDs() | N+1 + nested reads | Read | CRITICAL | 1000+/exec | Dashboard | 4 |
| 5 | app/(home)/maps/components/OSMMap.jsx | fetchHouseholds() | Nested collection reads | Read | CRITICAL | 1000+/load | Every map load | 5 |
| 6 | features/Households/services/householdUploadService.js | uploadHouseholdsFromFile() | Duplicate writes | Write | HIGH | 2400+/upload | Per upload | 6 |
| 7 | lib/api/memberService.js | getAllPWDMembers() | N+1 queries | Read | HIGH | 500+/exec | API calls | 7 |
| 8 | lib/api/memberService.js | getAllSeniorMembers() | N+1 queries | Read | HIGH | 500+/exec | API calls | 8 |
| 9 | app/(home)/reports/page.jsx | loadAffectedHouseholds() | Nested geo reads | Read | HIGH | 1000+/load | Per hazard tab | 9 |
| 10 | middleware.js + lib/auth/getSessionUser.js | Session validation | Read on every request | Read | MEDIUM | Variable | Every API call | 10 |
| 11 | features/Households/components/Forms/*.jsx | Various handleSubmit() | Duplicate writes + no batching | Write | MEDIUM | 100+/form | Per form submit | 11 |

---

## Quota Impact Estimation

### Current Daily Quota Consumption (Estimated)

Assuming:
- 10 daily active users
- 500 households with avg 5 members
- 10 report loads
- 5 map page loads
- 2 household uploads

**Reads:**
- Senior report × 10: 10 × 3,500 = 35,000 reads
- PWD report × 10: 10 × 1,500 = 15,000 reads
- Map loads × 5: 5 × 1,000 = 5,000 reads
- Session validation (50 API calls × 10 users): 500 reads
- Other data access: 10,000 reads
- **Total: ~65,000+ reads/day**

**Writes:**
- Forms (100 forms × 20 writes): 2,000 writes
- Household uploads (2 × 2,400): 4,800 writes
- Dashboard updates: 500 writes
- **Total: ~7,300 writes/day**

**Monthly Impact:**
- Reads: 65,000 × 30 = **1,950,000 reads/month** (Standard tier: 50 million reads/month = 3.9% of quota)
- Writes: 7,300 × 30 = **219,000 writes/month** (Standard tier: 20 million writes/month = 1.1% of quota)

**With optimizations, this could be reduced by 70-80%:**
- Optimized reads: ~20,000/day = **600,000/month** (1.2% of quota)
- Optimized writes: ~2,000/day = **60,000/month** (0.3% of quota)

---

## Which Module Is The Worst Offender?

**The Reports Module** is the single biggest consumer:
- Senior report = 3,500+ reads/execution
- PWD report = 1,500+ reads/execution
- Affected households = 1,000+ reads/execution
- **Combined: 6,000+ reads per report collection**
- Frequency: Multiple times daily
- **Estimated: 36,000+ reads/day from reports alone** (57% of total)

**The Maps Module** is second:
- Household fetching = 1,000+ reads/load
- Affects household modal interactions
- Estimated: 5,000+ reads/day (8% of total)

---

## Which Fixes Should Be Done First?

### Phase 1: CRITICAL (Do Immediately) - Saves ~40,000 reads/day
1. **Issue #1-4: Remove N+1 queries from Reports**
   - Replace seniorServices.js with household summary queries
   - Replace pwdService.js with household summary queries
   - Use `totalSeniors` and `totalPWDs` from household docs
   - **Savings: ~45,000 reads/day**

### Phase 2: HIGH (Do Next Sprint) - Saves ~5,000 reads/day
2. **Issue #5: Fix OSMMap household fetching**
   - Remove members collection reads
   - Use parent household doc only
   - **Savings: 5,000 reads/day**

3. **Issue #6: Fix duplicate writes in uploads**
   - Remove geographicIdentification duplication
   - Remove member demographic duplication
   - **Savings: ~2,000 writes/day**

### Phase 3: MEDIUM (Do Later) - Saves ~5,000 reads/day
4. **Issue #10: Cache session validation**
   - Validate session in ClientContext, not on every API request
   - **Savings: ~3,000 reads/day**

5. **Issue #7-8: Fix member service N+1 queries**
   - Use collectionGroup queries or household summary
   - **Savings: ~2,000 reads/day**

---

## Which Fixes Require Schema Changes?

### Schema Changes Required:
1. ✅ Remove geographicIdentification subcollection (or mark as deprecated)
2. ✅ Remove demographicCharacteristics subcollection (or mark as deprecated)
3. ✅ Ensure totalSeniors/totalPWDs are always calculated in household docs
4. ✅ Consider adding indexes for isSeniorCitizen and isPWD queries

### Schema Changes Optional (But Recommended):
1. ⚠️ Add member count fields to household doc for faster aggregation
2. ⚠️ Denormalize head name and contact to household top-level

### No Schema Changes Needed:
1. ✅ Session validation optimization (app layer only)
2. ✅ Form batching (app layer only)
3. ✅ Context caching (app layer only)

---

## Recommended Fix Implementation Order

```
Week 1: Remove N+1 from Reports (Issues #1-4) - Time: 2-3 days
├─ Update app/api/reports/seniors/route.js to use household totals
├─ Update app/api/reports/pwd/route.js to use household totals
├─ Remove seniorServices.js deprecated N+1 logic
└─ Remove pwdService.js deprecated N+1 logic

Week 2: Fix OSMMap and Session (Issues #2, #10) - Time: 2-3 days
├─ Optimize OSMMap.jsx to use household data only
├─ Implement session caching in authContext.jsx
└─ Test concurrent users

Week 3: Fix Uploads and Forms (Issues #5, #11) - Time: 2-3 days
├─ Update householdUploadService.js to remove duplicates
├─ Add writeBatch to form submissions
└─ Test bulk upload performance

Week 4: Fix Member Service (Issues #7-8) - Time: 1-2 days
├─ Optimize getAllPWDMembers() and getAllSeniorMembers()
└─ Add new server-side aggregation API if needed

Total Expected Effort: 1-2 weeks
Expected Quota Reduction: 70-80%
Estimated Savings: 50,000+ reads/day
```

---

## Conclusion

LUWAS is experiencing quota overages primarily due to **N+1 query patterns in the Reports module** (57% of quota waste) and **unnecessary nested subcollection reads in Maps** (8% of quota waste). 

The root cause is relying on low-level Firestore queries instead of using the pre-calculated summary data already stored in household documents.

**Most issues can be fixed in 1-2 weeks with minimal code changes, reducing quota consumption by 70-80%** without any breaking changes to the user-facing application.
