# Security and Access Control

LUWAS combines Firebase authentication, server-managed sessions, middleware checks, and route-level role enforcement.

## Session behavior

- Firebase client login provides an ID token.
- `/api/auth/login` exchanges that token for HTTP-only `session` and `sessionToken` cookies.
- Session lifetime is five days in the current implementation.
- `users/{uid}.activeSessionToken` enforces a single active server session.
- `/api/auth/logout` clears cookies and resets the active session token.

## Core guards

| Layer | Responsibility |
| --- | --- |
| `middleware.js` | Protects page routes and redirects by role and profile-completion state |
| `lib/auth/getSessionUser.js` | Validates cookies, Firebase session, role, status, and barangay state |
| `components/roleGuard.jsx` | Client-side role guard for protected pages |
| Route-level checks | Enforce module-specific access rules inside API handlers |

## Page access matrix

| Route | Access |
| --- | --- |
| `/login`, `/forgotpass` | Public-only pages |
| `/profile`, `/profile/edit-profile` | Authenticated users; pending users are directed to edit profile |
| `/household` | All authenticated roles |
| `/map` | `MDRRMC-Admin`, `MDRRMC-Personnel`, `Brgy-Secretary` |
| `/dashboard` | `MDRRMC-Personnel`, `Brgy-Secretary` |
| `/reports` | `MDRRMC-Personnel`, `Brgy-Secretary` |
| `/users`, `/hazards` | `MDRRMC-Admin` only |
| `/unauthorized` | Logged-in users only |

## Data-access rules

### Barangay restriction

`Brgy-Secretary` users are restricted to their assigned barangay across:

- household reads and writes
- reports
- map household markers
- accident reads

### Admin-only operations

`MDRRMC-Admin` is required for:

- user management
- hazard creation and deletion
- boundary upload
- default map-center updates

### Profile restrictions

Self-service profile updates do not allow:

- role changes
- email changes through this endpoint
- unrestricted barangay changes after activation

## Pending-profile flow

Newly created users can exist with:

- `role: null`
- `status: pending`

Those users are allowed through the profile update flow but are redirected away from normal app pages until the profile is completed and the account state is usable.

## Operational reminder

If page access and API access disagree, inspect both middleware behavior and route-level role checks before changing anything. Most permission bugs in this codebase involve session state, role assignment, or missing barangay values rather than client UI alone.
