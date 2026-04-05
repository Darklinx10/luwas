AUTHENTICATION FIRESTORE ERROR - DIAGNOSTIC CHECKLIST
=====================================================

ERROR: gRPC code 5 NOT_FOUND when Admin SDK tries to acces Firestore

Status: Database exists, but Server-side access is failing

---

## DIAGNOSTIC CHECKLIST - VERIFY EACH STEP

### 1. SERVICE ACCOUNT PERMISSIONS
☐ Go to Firebase Console → Project Settings → Service Accounts
☐ Verify the service account email: firebase-adminsdk-fbsvc@luwas-f0405.iam.gserviceaccount.com
☐ Click "Generate new private key"
☐ Download the new JSON key
☐ Compare with the credentials in .env.local - do they match?
  - project_id
  - private_key_id
  - client_email
  - client_id

If NOT matching → UPDATE .env.local with new credentials

### 2. FIREBASE PROJECT CONSISTENCY
☐ In Firebase Console, check the project ID shown
   - Should be: luwas-f0405
☐ In .env.local, verify FIREBASE_PROJECT_ID=luwas-f0405
☐ In .env.local, verify NEXT_PUBLIC_FIREBASE_PROJECT_ID=luwas-f0405
☐ Verify FIREBASE_CLIENT_EMAIL ends with @luwas-f0405.iam.gserviceaccount.com

If any mismatch → Fix all to use luwas-f0405

### 3. SERVICE ACCOUNT FIRESTORE PERMISSIONS
☐ Go to Google Cloud Console → luwas-f0405 project
☐ Navigate to IAM & Admin → Roles
☐ Find the service account: firebase-adminsdk-fbsvc@luwas-f0405.iam.gserviceaccount.com
☐ Check it has role: "Firebase Service Management Service Agent"
☐ Optionally add: "Cloud Datastore User" or "Cloud Firestore Service Agent"

If permissions missing → Add the necessary roles

### 4. FIRESTORE DATABASE INITIALIZATION
☐ Go to Firebase Console → "Create database" button
☐ Verify database exists (green checkmark)
☐ Check database location: us-central1 (or your region)
☐ Check if database is "Production mode" or "Test mode"
   - Test mode is easier for development (no strict rules)

If test mode active → Rules are very permissive, should work
If production mode → Rules are strict, might be the issue

### 5. VERIFY CONNECTION WITH TEST QUERY
Create a temporary test file to verify Admin SDK works:

File: app/api/test-firestore/route.js

```javascript
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    console.log('🧪 Testing Firestore connection...');

    // Test 1: Collections list
    const collections = await adminDb.listCollections();
    console.log('✅ Collections:', collections.map(c => c.id));

    // Test 2: Users collection exists
    const snapshot = await adminDb.collection('users').limit(1).get();
    console.log('✅ Users collection access successful:', snapshot.docs.length, 'docs');

    return NextResponse.json({ status: 'ok', collections: collections.map(c => c.id) });
  } catch (error) {
    console.error('❌ Firestore test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

Then go to: http://localhost:3000/api/test-firestore
And report what happens

### 6. CREDENTIALS VS ENVIRONMENT
☐ Restart dev server completely after any .env.local changes
   - Kill all Node processes
   - Restart npm run dev
☐ Confirm .env.local changes are loaded
   - Check if console logs show updated values
   - Or add a temp endpoint that logs env vars

---

## MOST LIKELY ISSUES (in order)

1. **Service account is outdated**
   - Private key expired or rotated
   - Solution: Download new key from Firebase Console

2. **Firestore database not initialized**
   - Created but not actually deployed
   - Solution: Delete and recreate database in Test mode

3. **Database in different project**
   - Database for luwas-d69f8 instead of luwas-f0405
   - Solution: Check Firebase Console shows luwas-f0405 project

4. **Environment variables not loaded**
   - .env.local not read correctly
   - Dev server cache issue
   - Solution: Kill all processes, restart fresh

5. **Security rules too restrictive**
   - Even Admin SDK respects project rules in some cases
   - Solution: Temporarily set rules to "allow all" for testing

---

## QUICK FIXES TO TRY (in order)

**Fix #1 - Refresh Service Account Key**
1. Firebase Console → Project Settings → Service Accounts
2. Generate new key
3. Update .env.local with new credentials
4. Kill dev server and restart
5. Test login

**Fix #2 - Verify Firestore Database**
1. Go to Firebase Console → Build → Firestore Database
2. Click "Create database"
3. If it errors or shows existing, note the region
4. Set to "Test mode" temporarily
5. Kill dev server and restart
6. Test login

**Fix #3 - Use Test Endpoint**
1. Create /api/test-firestore/route.js (code above)
2. Visit http://localhost:3000/api/test-firestore
3. See what works/fails
4. Report findings

---

## WHAT TO REPORT BACK

After running diagnostics, tell me:
1. ✅ or ❌ Service account matches in Firebase Console
2. ✅ or ❌ Firestore database shows in console (and region)
3. ✅ or ❌ Test mode or Production mode
4. ✅ or ❌ What /api/test-firestore endpoint returns

This will pinpoint the exact issue!
