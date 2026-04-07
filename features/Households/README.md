# Household Module - LUWAS

## Overview

The Household Module is the central feature for managing household data, members, and geographic information in the LUWAS system. It provides a complete CRUD interface, bulk upload capabilities, and multi-section form workflows for detailed household surveys.

**Architecture:** Fully API-based with server-side authentication and authorization. All client-side data access goes through `/api/households/*` endpoints.

## File Structure

```
features/Households/
├── index.js                          # Module exports
├── components/
│   ├── HouseholdPageContent.jsx      # ✅ Main listing page (via useHouseholds hook)
│   ├── HouseholdTable.jsx            # ✅ Table display with actions
│   ├── HouseholdMembersTable.jsx     # ✅ Expandable member rows
│   ├── HouseholdFormShell.jsx        # ✅ NEW: Shared form container for Add/Edit
│   ├── formSectionSidebar.jsx        # ✅ Form section navigation
│   ├── UploadHouseholdModal.jsx      # ✅ Bulk upload dialog
│   ├── UploadProgressBar.jsx         # ✅ Progress indicator
│   ├── Pagination.jsx                # ✅ Table pagination
│   └── Forms/                        # ✅ Form section components (5+ sections)
│       ├── geographic-information.jsx # ✅ Location & barangay
│       ├── demographics.jsx           # ✅ Family composition & statistics
│       ├── health.jsx                 # ✅ Health & maternal information
│       ├── education.jsx              # ✅ Education level tracking
│       ├── economic.jsx               # ✅ Income & livelihood
│       ├── HeadForm.jsx               # Sub-component for quick-add
│       ├── LocationForm.jsx           # Sub-component for quick-add
│       └── MembersForm.jsx            # Sub-component for quick-add
├── hooks/
│   ├── useHouseholds.js              # ✅ Household list management
│   └── useHouseholdUpload.js         # ✅ Upload progress management
├── services/
│   ├── householdApi.js               # ✅ Client → API layer
│   └── householdUploadService.js     # ✅ Batch upload parsing
├── utils/
│   ├── formSectionsConfig.js         # ✅ NEW: Centralized form definitions
│   ├── buildHouseholdPayload.js      # ✅ Data normalization
│   ├── householdFormat.js            # ✅ Data formatting
│   └── householdQuery.js             # ✅ Query builder
```

### API Routes (All with Server-Side Auth)

```
app/api/households/
├── route.js                          # ✅ GET list, POST create (with auth/authz)
├── [householdId]/
│   ├── route.js                      # ✅ GET detail, PATCH update, DELETE
│   └── members/
│       ├── route.js                  # ✅ GET member list, POST create
│       └── [memberId]/
│           └── route.js              # ✅ PATCH update member, DELETE

app/(home)/household/
├── page.jsx                          # ✅ Household listing (RoleGuard protected)
├── quick-add/page.jsx                # ✅ Fast 3-step registration
├── add/page.jsx                      # ✅ REFACTORED: Multi-section form (API-based)
└── edit/[householdId]/page.jsx       # ✅ REFACTORED: Edit household (API-based)
```

### Deleted (Dead Code)
- ❌ editMemberModal.jsx (replaced by form sections)
- ❌ editHouseholModal.jsx (replaced by HouseholdFormShell)
- ❌ edithhMemberModal.jsx (typo, unused)
- ❌ HouseholdMemberTble.jsx (typo, replaced by HouseholdMembersTable.jsx)
- ❌ QuickHouseholdForm.jsx (old Firebase implementation)

### Library Services

```
lib/api/
├── householdService.js               # Firestore CRUD for households
├── memberService.js                  # Firestore CRUD for members
└── recalculateTotals.js             # Household aggregate totals
```

---

## Data Flow

### 1. **List Households**

```
HouseholdPageContent
  └─ useHouseholds()
      └─ householdApi.fetchHouseholds()
          └─ GET /api/households
              └─ householdService.fetchHouseholdsQuery()
                  └─ adminDb.collection('households').query()
```

**Top-Level Fields Loaded:**
- householdId, barangay, sitio
- Head names (firstName, lastName, fullName)
- contactNumber, homes[], hasMapLocation
- totalResidents, totalMale, totalFemale, totalPWDs, totalSeniors
- createdAt, updatedAt

### 2. **Expand Household & Load Members**

```
HouseholdTable.toggleExpanded()
  └─ useHouseholds.toggleExpanded()
      └─ householdApi.fetchMembers(householdId)
          └─ GET /api/households/{id}/members
              └─ memberService.fetchMembersQuery(householdId)
                  └─ adminDb.collection('households/id/members').query()
```

**Member Fields Loaded:**
- firstName, middleName, lastName, suffix
- sex, age, relationshipToHead
- barangay, sitio, contactNumber
- isPWD, isSeniorCitizen
- id, householdId

### 3. **Create/Update Member**

```
EditMemberModal.onSave()
  └─ householdApi.createMember() or updateMember()
      └─ POST/PATCH /api/households/{id}/members[/{memberId}]
          └─ memberService.createMember() / updateMember()
              └─ adminDb.collection('households/id/members').add/update()
              └─ recalculateHouseholdTotals(householdId) [triggers async]
```

**Auto-Calculated on Member Save:**
- household.totalResidents
- household.totalMale, totalFemale
- household.totalPWDs (if isPWD === true)
- household.totalSeniors (if age >= 60)

### 4. **Bulk Upload Households**

```
UploadHouseholdsModal
  └─ useHouseholdUpload.handleUpload()
      └─ householdUploadService.uploadHouseholdsFromFile()
          1. Read file (CSV/Excel/JSON)
          2. Parse households & members
          3. Batch write to Firestore:
             - households/{id} top-level doc
             - households/{id}/geographicIdentification/main
             - households/{id}/members/{memberId}
             - households/{id}/members/{id}/demographicCharacteristics/main
          4. Report progress via callback
```

**Progress Stages:**
- reading (5%) → parsing (15%) → mapping (25%) → building (35%) → uploading (35-95%) → completed (100%)

---

## Firestore Structure

### Households Collection

```javascript
households/{householdId}
{
  // Identity
  householdId: string (PK),
  
  // Head Information
  headFirstName: string,
  headMiddleName: string,
  headLastName: string,
  headSuffix: string,
  headFullName: string (computed),
  headSex: string,
  headAge: number,
  
  // Location (for Secretary filtering & grouping)
  barangay: string (INDEXED),
  sitio: string,
  
  // Contact
  contactNumber: string,
  
  // Geolocation
  homes: [{
    label: string,
    latitude: number,
    longitude: number
  }],
  hasMapLocation: boolean (computed),
  
  // Aggregates (computed from members)
  totalResidents: number,
  totalFamilies: number,
  totalMale: number,
  totalFemale: number,
  totalPWDs: number,
  totalSeniors: number,
  
  // Audit
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: userId,
  updatedBy: userId,
}
```

### Members Subcollection

```javascript
households/{householdId}/members/{memberId}
{
  // Member info
  firstName: string,
  middleName: string,
  lastName: string,
  suffix: string,
  fullName: string (computed),
  
  // Demographics
  sex: string,
  age: number,
  barangay: string,
  sitio: string,
  
  // Household relationship
  householdId: string,
  relationshipToHead: string,
  
  // Contact
  contactNumber: string,
  
  // Special populations
  isPWD: boolean,
  isSeniorCitizen: boolean (computed from age >= 60),
  
  // Audit
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: userId,
  updatedBy: userId,
}
```

### Geographic Identification Subcollection

```javascript
households/{householdId}/geographicIdentification/main
{
  // Head info (mirrors top-level for backup)
  headFirstName: string,
  headLastName: string,
  headSex: string,
  headAge: number,
  
  // Location
  barangay: string,
  sitio: string,
  contactNumber: string,
  
  // Multiple homes
  homes: [{
    label: string,
    latitude: number,
    longitude: number
  }],
}
```

---

## API Endpoints

### GET /api/households

**Query Params:**
- `page` (1-based, default: 1)
- `limit` (1-100, default: 10)
- `search` (searches: householdId, headFirstName, headLastName, barangay, sitio)
- `sort` (allowed: headLastName, headFirstName, barangay, sitio, createdAt; default: headLastName)
- `order` (asc/desc, default: asc)

**Response:**
```json
{
  "households": [{ householdId, headFirstName, barangay, ... }],
  "totalHouseholds": number,
  "totalResidents": number (sum of totalResidents from all households),
  "totalPages": number,
  "hasNextPage": boolean,
  "hasPrevPage": boolean
}
```

**Auth:** Requires authentication. Secretary sees only their barangay.

---

### POST /api/households

**Payload:**
```json
{
  "headFirstName": "string (required)",
  "headLastName": "string (required)",
  "barangay": "string (required)",
  "sitio": "string (optional)",
  "headSex": "string (optional)",
  "headAge": "number (optional)",
  "contactNumber": "string (optional)",
  "homes": [{ "label": "string", "latitude": number, "longitude": number }]
}
```

**Response:**
```json
{
  "success": true,
  "householdId": "string"
}
```

**Auth:** Secretary (own barangay only), Admin. Requires barangay configured.

---

### GET /api/households/{householdId}

**Response:**
```json
{
  "household": { householdId, headFirstName, barangay, ... }
}
```

**Auth:** Requires authentication. Secretary must have access to household's barangay.

---

### PATCH /api/households/{householdId}

**Payload:** (any household top-level field)
```json
{
  "headFirstName": "string",
  "contactNumber": "string",
  "homes": [...],
  ...
}
```

**Auth:** Secretary, Admin. Secretary must have access to household's barangay.

---

### DELETE /api/households/{householdId}

**Auth:** Secretary, Admin. Secretary must have access to household's barangay.

**Note:** Cascades delete all members and subcollections.

---

### GET /api/households/{householdId}/members

**Query Params:**
- `page` (1-based, default: 1)
- `limit` (1-100, default: 20)
- `search` (searches: firstName, lastName, fullName)

**Response:**
```json
{
  "members": [{
    "memberId": "string",
    "householdId": "string",
    "firstName": "string",
    "age": "number",
    ...
  }],
  "totalMembers": number,
  "totalPages": number,
  "hasNextPage": boolean,
  "hasPrevPage": boolean
}
```

**Auth:** Requires authentication. Secretary must have access to household's barangay.

---

### POST /api/households/{householdId}/members

**Payload:**
```json
{
  "firstName": "string (required)",
  "lastName": "string (required)",
  "middleName": "string (optional)",
  "suffix": "string (optional)",
  "sex": "string (optional)",
  "age": "number (optional)",
  "birthdate": "string (optional, ISO format)",
  "relationshipToHead": "string (optional)",
  "barangay": "string (optional)",
  "sitio": "string (optional)",
  "contactNumber": "string (optional)",
  "isPWD": "boolean (default: false)",
  "isSeniorCitizen": "boolean (auto-computed from age)"
}
```

**Response:**
```json
{
  "success": true,
  "memberId": "string"
}
```

**Auth:** Secretary (own barangay), Admin.

**Side Effects:**
- Auto-calculates isSeniorCitizen if age >= 60
- Recalculates household totals (async)

---

### PATCH /api/households/{householdId}/members/{memberId}

**Payload:** (any member field)

**Auth:** Secretary (own barangay), Admin.

**Side Effects:**
- Recalculates household totals (async)

---

### DELETE /api/households/{householdId}/members/{memberId}

**Auth:** Secretary (own barangay), Admin.

**Side Effects:**
- Recalculates household totals (async)

---

## Component Reference

### HouseholdPageContent

**Main container**. Orchestrates:
- Table display (HouseholdTable)
- Member modal (EditMemberModal)
- Upload modal (UploadHouseholdsModal)
- Map popup (MapPopup)
- Pagination

**Props:** None (uses hooks)

**Exports:** Default export from `features/Households`

---

### EditMemberModal

**Form modal for creating/editing members**

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| isOpen | boolean | Yes | Show/hide modal |
| member | object | Yes | Member data to edit |
| onClose | function | Yes | Callback to close |
| onChange | function | Yes | Handle field change |
| onSave | function | Yes | Handle save |
| updating | boolean | No | Loading state |

**Features:**
- Auto-capitalize name fields
- Age is read-only (computed from birthdate)
- PWD checkbox
- Sex dropdown

---

### UploadHouseholdModal

**Modal for bulk uploading households + members**

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| isOpen | boolean | Yes | Show/hide modal |
| onClose | function | Yes | Callback to close |
| onUploadSuccess | function | No | Called on success (count) |

**Features:**
- File validation (CSV, Excel, JSON)
- Progress bar with stage names
- Error display & retry
- Two sheets required: "households" and "members"

---

## Hooks

### useHouseholds()

**Main hook for household list management**

```javascript
const {
  // State
  households,            // Array of household objects
  page,                  // Current page (1-based)
  loading,               // Is fetching
  totalHouseholds,       // Count of all households
  totalResidents,        // Sum of residents
  totalPages,            // Pagination info
  
  // Members
  expandedHouseholds,    // { householdId: boolean }
  membersData,           // { householdId: [members] }
  loadingMembers,        // { householdId: boolean }
  
  // Edit Member Modal
  editMemberModal,       // { isOpen, member, updating }
  
  // Upload Modal
  uploadModalOpen,       // boolean
  
  // Methods
  setPage,               // (page) => void
  setSearchInput,        // (search) => void
  handleSearchSubmit,    // (e) => void
  toggleExpanded,        // (householdId) => void
  handleEditMember,      // (householdId, member) => void
  handleSaveEditMember,  // () => Promise<void>
  handleDeleteMember,    // (householdId, memberId) => Promise<void>
  handleDeleteHousehold, // (householdId) => Promise<void>
  handleUploadHouseholdData, // () => void
  handleUploadSuccess,   // (count) => void
  downloadCSV,           // () => Promise<void>
} = useHouseholds();
```

---

### useHouseholdUpload()

**Manage upload progress and state**

```javascript
const {
  // State
  percentage,         // 0-100
  stage,              // 'reading', 'parsing', 'mapping', 'building', 'uploading', 'completed'
  stageName,         // Human-readable stage name
  message,           // Current message
  currentBatch,      // Current batch number
  totalBatches,      // Total batches
  isUploading,       // Is currently uploading
  isComplete,        // Upload finished
  error,             // Error message if failed
  
  // Methods
  handleUpload,      // (file, onSuccess) => Promise<void>
  resetProgress,     // () => void
} = useHouseholdUpload();
```

---

## Usage Examples

### Adding a Household

```javascript
// 1. Via API (recommended)
const response = await fetch('/api/households', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    headFirstName: 'Juan',
    headLastName: 'Dela Cruz',
    barangay: 'Barangay 1',
    sitio: 'Sitio A',
    contactNumber: '09171234567',
  }),
});
const { householdId } = await response.json();

// 2. Via multi-section form
// Navigate to /household/add (uses client-side form with 20+ sections)
```

### Adding a Member

```javascript
// Via API
const response = await fetch('/api/households/{householdId}/members', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'Maria',
    lastName: 'Dela Cruz',
    sex: 'Female',
    age: 8,
    relationshipToHead: 'Child',
  }),
});
const { memberId } = await response.json();
```

### Bulk Upload

```javascript
// Via UI Modal
// 1. Click "Upload Household Data" button on household page
// 2. Select CSV/Excel/JSON file with data
// 3. Watch progress bar
// 4. View results

// File format (CSV headers or JSON keys):
// Households sheet:
//   Household ID, Head FirstName, Head LastName, Head Sex, Head Age,
//   Contact Number, Barangay, Sitio,
//   Home1 Latitude, Home1 Longitude, ...
//
// Members sheet:
//   Household ID, Member ID, FirstName, LastName, Sex, Age,
//   Relationship To Head, Contact Number, Is PWD
```

---

## Indexing & Performance

### Recommended Firestore Indexes

```
1. Collection: households
   - Field: barangay (Ascending) [REQUIRED for Secretary queries]
   - Field: createdAt (Descending)

2. Collection: households (top-level only)
   - Field: barangay (Ascending)
   - Field: headLastName (Ascending)
   [Used for listing Secretary's households by name]
```

### Known Performance Notes

- Dashboard reads **only top-level household fields** (no nested reads) for ~100x speed
- Member list queries fetch all members then sort in-memory (avoids compound indexes)
- Upload batches in groups of 400 to avoid write limits

---

## Error Handling

### Common Errors

| Error | Message | Cause | Fix |
|-------|---------|-------|-----|
| 401 | Unauthorized | User not authenticated | Login required |
| 403 | Forbidden | Access denied | Secretary can only access own barangay |
| 400 | Missing required field | Required data missing | Check payload |
| 404 | Household not found | Household ID invalid| Verify ID exists |
| 422 | Upload failed | Invalid file format | Check file structure |

### Error Display

- API errors → toast.error(message)
- Upload errors → displayed in modal with retry button
- Member edit errors → toast.error() + stay in modal

---

## Testing Checklist

- [ ] Create household (Secretary & Admin)
- [ ] List households (filter by barangay for Secretary)
- [ ] Update household info
- [ ] Delete household (cascades to members)
- [ ] Add member to household
- [ ] Edit member
- [ ] Delete member (recalculates totals)
- [ ] Bulk upload 100+ households + members
- [ ] Search households by name/barangay
- [ ] Expand/collapse member list
- [ ] View member on map
- [ ] Print household table
- [ ] Download CSV

---

## Recent Improvements (April 7, 2026)

✅ **Form Data Persistence** - All form sections now save through API (onSaveProgress callback)
✅ **Additional Form Sections** - Added Demographics, Education, and Economic forms (5 sections total)
✅ **Unified Architecture** - Both Add and Edit workflows use shared HouseholdFormShell
✅ **API-First Pattern** - Removed all direct Firestore writes from client components
✅ **Dead Code Cleanup** - Deleted 6 unused modal components and references
✅ **Configuration-Driven** - formSectionsConfig.js centralizes form definitions

## Known Limitations & TODOs

1. **Member Management in Edit Flow**: API endpoints exist but UI forms for member CRUD not yet built
2. **Resume Incomplete Households**: Form can resume at last section, but could be smarter
3. **Form Section Optimization**: Each section independently loads data; could be batched
4. **Firestore Subcollections**: Still using geographicIdentification/main subcollection; could consolidate
5. **Error Recovery**: Limited retry logic if section save fails partway through

## Planned Enhancements

- Member management forms for adding/editing/deleting household members in edit flow
- Additional form sections (Migration, Agriculture, Entrepreneurship, etc.) following established pattern
- Firestore rules validation matching API layer authorization
- Form completion percentage indicator
- Auto-save between sections with offline support
- Household template/drafts feature

---

## Module Status

✅ **Production Ready** - Household List, Member Management, Bulk Upload, Multi-section Add/Edit
🟡 **Partial** - Member CRUD forms in edit flow (API ready, UI pending)
✅ **Fully Refactored** - All client data access through API layer with authentication

---

Created: March 30, 2026
Last Updated: April 7, 2026
Module Version: 1.1.0 (Refactored with Form Data Persistence)
