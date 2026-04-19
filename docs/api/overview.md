# API Overview

LUWAS uses Next.js App Router server routes under `app/api`. Most routes rely on `getSessionUser()` and role checks before touching Firestore.

## Session model

The authentication flow is:

1. Firebase client login returns an ID token.
2. `/api/auth/profile/create` ensures a Firestore profile exists.
3. `/api/auth/login` creates HTTP-only `session` and `sessionToken` cookies.
4. `getSessionUser()` validates both cookies, the Firebase session, and `users/{uid}.activeSessionToken`.
5. Middleware and route-level role checks decide access.

## Route groups

### Authentication

| Route | Methods | Access | Notes |
| --- | --- | --- | --- |
| `/api/auth/checkEmail` | `POST` | Public | Checks whether an email exists in Firebase Auth |
| `/api/auth/profile/create` | `POST` | Firebase-authenticated client | Creates or returns a pending Firestore profile |
| `/api/auth/login` | `POST` | Firebase-authenticated client | Exchanges ID token for server session cookies |
| `/api/auth/me` | `GET` | Authenticated | Returns the current session user, including pending profiles |
| `/api/auth/logout` | `POST` | Authenticated | Clears cookies and invalidates the active session token |

### Profile

| Route | Methods | Access | Notes |
| --- | --- | --- | --- |
| `/api/profile/update` | `GET`, `POST` | Authenticated, including pending profiles | Self-service profile refresh and update |

### Households

| Route | Methods | Access | Notes |
| --- | --- | --- | --- |
| `/api/households` | `GET` | Authenticated | Supports `page`, `limit`, `search`, `sort`, `order`, `exportAll` |
| `/api/households` | `POST` | `Brgy-Secretary`, `MDRRMC-Admin` | Creates a household |
| `/api/households/[householdId]` | `GET`, `PATCH`, `DELETE` | Authenticated for read, secretary/admin for write | Secretary access is barangay-scoped |
| `/api/households/[householdId]/members` | `GET`, `POST` | Authenticated for read, secretary/admin for write | Member list and creation |
| `/api/households/[householdId]/members/[memberId]` | `PATCH`, `DELETE` | `Brgy-Secretary`, `MDRRMC-Admin` | Recalculates household totals after changes |
| `/api/households/upload` | `POST` | `MDRRMC-Admin` | Bulk upload pipeline |

### Dashboard and reports

| Route | Methods | Access | Notes |
| --- | --- | --- | --- |
| `/api/dashboard` | `GET` | `Brgy-Secretary`, `MDRRMC-Personnel` | Aggregates from top-level household summary fields |
| `/api/reports/pwd` | `GET` | `Brgy-Secretary`, `MDRRMC-Personnel` | Supports `page`, `limit`, `search`, `exportAll` |
| `/api/reports/seniors` | `GET` | `Brgy-Secretary`, `MDRRMC-Personnel` | Supports `page`, `limit`, `search`, `exportAll` |
| `/api/reports/affected-households` | `GET` | `Brgy-Secretary`, `MDRRMC-Personnel` | Uses `hazardType` and server-side spatial checks |

### Accidents

| Route | Methods | Access | Notes |
| --- | --- | --- | --- |
| `/api/accidents` | `GET` | Authenticated | Secretaries are filtered to their barangay |
| `/api/accidents` | `POST` | `MDRRMC-Personnel`, `MDRRMC-Admin` | Creates a new accident |
| `/api/accidents/[id]` | `GET` | Authenticated | Barangay restrictions apply to secretaries |
| `/api/accidents/[id]` | `PATCH`, `DELETE` | `MDRRMC-Personnel`, `MDRRMC-Admin` | Updates and deletes accident records |

### Maps and hazards

| Route | Methods | Access | Notes |
| --- | --- | --- | --- |
| `/api/maps/household-markers` | `GET` | All three roles | Returns ready-to-render household marker data |
| `/api/maps/boundary` | `GET` | Authenticated | Returns stored administrative boundary |
| `/api/maps/boundary` | `POST` | `MDRRMC-Admin` | Uploads `.geojson` boundary data |
| `/api/maps/settings/default-center` | `GET` | Authenticated | Returns saved or fallback map center |
| `/api/maps/settings/default-center` | `POST` | `MDRRMC-Admin` | Updates map center |
| `/api/hazards` | `GET` | All three roles | Lists hazard summaries or returns merged hazard data |
| `/api/hazards` | `POST`, `DELETE` | `MDRRMC-Admin` | Hazard maintenance endpoints |

### User management

| Route | Methods | Access | Notes |
| --- | --- | --- | --- |
| `/api/users` | `GET`, `POST` | `MDRRMC-Admin` | Lists users or creates non-admin users |
| `/api/users/[userId]` | `GET`, `PATCH`, `DELETE` | `MDRRMC-Admin` | PATCH does not allow email, password, role, or status changes |

### Internal example and diagnostic routes

These routes exist in the repo but are not part of the main product workflow:

- `/api/examples/*`
- `/api/test-composite-index`
- `/api/test-pwd-index`
- `/api/test-seniors-index`

Treat them as internal references or diagnostics rather than user-facing API surface.

## Related docs

- [Security and Access Control](../maintenance/security-access.md)
- [Firestore Operations](../maintenance/firestore-operations.md)
