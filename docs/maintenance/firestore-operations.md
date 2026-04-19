# Firestore Operations

This guide collects the Firestore-specific operational notes that matter for long-term maintenance of LUWAS.

## Current data layout

| Path | Purpose |
| --- | --- |
| `users/{uid}` | Profile data, role, status, barangay, active session token |
| `households/{householdId}` | Household summary fields, homes coordinates, aggregate counts |
| `households/{householdId}/members/{memberId}` | Household member records |
| `hazards/{hazardType}/hazardInfo/{docId}` | Hazard GeoJSON strings and metadata |
| `accidents/{accidentId}` | Accident records |
| `mapSettings/config` | Uploaded boundary GeoJSON |
| `settings/mapCenter` | Default center for the map |

## Index and query management

There is no committed `firestore.indexes.json` file in the repo today. Indexes are currently managed in the Firebase console.

Routes already surface missing-index information through `lib/api/firestoreErrorHandler.js`, especially for:

- `/api/households`
- `/api/accidents`
- `/api/reports/pwd`
- `/api/reports/seniors`
- `/api/users`

### Household list sorting

The household list supports sorting by:

- `headLastName`
- `headFirstName`
- `headMiddleName`
- `headSuffix`
- `totalPWDs`
- `totalSeniors`
- `hasMapLocation`

Any Firestore index strategy should stay aligned with those server-side sort options in `app/api/households/route.js`.

## Performance guidance

### Prefer top-level household summary fields

Dashboard and several report flows rely on top-level totals such as:

- `totalResidents`
- `totalMale`
- `totalFemale`
- `totalPWDs`
- `totalSeniors`
- `ageBrackets`
- `hasMapLocation`

These fields are important because they avoid repeated nested member scans for common analytics.

### Keep map queries lightweight

`/api/maps/household-markers` is designed to return marker-ready household data without loading every member record. Keep new map features aligned with that pattern instead of reintroducing N+1 reads.

### Report exports

- Households, PWD, and seniors support `exportAll=true` for full filtered export flows.
- Accident reporting returns the full list and the UI applies client-side filtering and pagination.
- Affected-households reporting computes intersections in memory using hazard polygons and household home coordinates.

## Common diagnostics

### `5 NOT_FOUND` from the Admin SDK

Check these first:

1. Firebase project ID matches on both client and server.
2. Service account belongs to the same project.
3. Firestore is initialized in that project.
4. `FIREBASE_DATABASE_ID` matches the actual database ID.
5. The server is using `default` when no database override is configured.

### `FAILED_PRECONDITION` / missing composite index

When this appears:

1. Read the server log or JSON response for the console link.
2. Create the suggested index in Firebase.
3. Wait for the index to finish building.
4. Retry the request.

### Secretary access failures

If a secretary can log in but cannot access expected data, confirm:

- `role` is `Brgy-Secretary`
- `status` is `active`
- `barangay` is set on `users/{uid}`

## Internal diagnostic routes

These routes are present for maintenance work:

- `/api/test-composite-index`
- `/api/test-pwd-index`
- `/api/test-seniors-index`

They should be treated as internal support tools rather than end-user product endpoints.
