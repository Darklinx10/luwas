# Households Feature

The households feature is the core registry workflow for LUWAS. It manages household summaries, homes coordinates, household members, quick-add flows, and admin upload operations.

## Routes and access

| Route | Purpose | Access |
| --- | --- | --- |
| `/household` | Household list and actions | All authenticated roles |
| `/household/quick-add` | Household creation form | Authenticated users with access to the page flow |
| `/household/edit/[householdId]` | Household edit form | Authenticated users with page access |

Write behavior is more restrictive at the API layer:

- `Brgy-Secretary` and `MDRRMC-Admin` can create, update, and delete households and members.
- `MDRRMC-Personnel` can view household data but does not own the write endpoints.
- `MDRRMC-Admin` owns bulk upload via `/api/households/upload`.

## Main files

```text
features/Households/
  components/
    HouseholdPageContent.jsx
    HouseholdTable.jsx
    HouseholdMembersTable.jsx
    UploadHouseholdModal.jsx
    UploadProgressBar.jsx
    Pagination.jsx
    Forms/
  hooks/
    useHouseholds.js
    useHouseholdUpload.js
  services/
    householdApi.js
    householdUploadService.js
  utils/
    buildHouseholdPayload.js
    formSectionsConfig.js
    householdFormat.js
    householdQuery.js
  index.js
```

## Data model

Primary records live in `households/{householdId}` and include:

- household head name fields
- `barangay`
- `homes`
- contact information
- top-level summary fields such as `totalResidents`, `totalPWDs`, and `totalSeniors`

Members live under:

- `households/{householdId}/members/{memberId}`

The server-side service layer also accounts for related subcollections such as `demographicCharacteristics`, `geographicIdentification`, and `health` when cleaning up or normalizing household data.

## API surface

| Route | Notes |
| --- | --- |
| `/api/households` | Supports `page`, `limit`, `search`, `sort`, `order`, `exportAll` |
| `/api/households/[householdId]` | Detail, update, and delete |
| `/api/households/[householdId]/members` | Member list and create |
| `/api/households/[householdId]/members/[memberId]` | Member update and delete |
| `/api/households/upload` | Admin-only bulk upload |

## User-facing capabilities

- Search and sort the household list
- Expand a household to inspect members
- Create and edit households through form-driven pages
- Create, edit, and delete members
- Print or export the full filtered household list
- Upload household data in bulk as an admin

## Maintenance notes

- Keep household aggregate fields in sync with member writes.
- Prefer extending `householdApi.js` and the server routes instead of calling Firestore directly from components.
- The canonical create flow is `/household/quick-add`; older references to `/household/add` are obsolete in the current app structure.
