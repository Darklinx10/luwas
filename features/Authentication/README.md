# Authentication Feature

This feature owns the client-side authentication flows and works together with middleware and server routes to provide secure session-based access.

## Scope

- Login UI
- Forgot-password flow
- Session refresh and logout helpers
- Post-login redirect logic
- Pending-profile onboarding support

## Main files

```text
features/Authentication/
  components/
    LoginForm.jsx
    ForgotPasswordForm.jsx
  hooks/
    useLogin.js
    useForgotPassword.js
  services/
    authService.js
  utils/
    authErrors.js
    authRedirect.js
    authStorage.js
```

Related cross-cutting files:

- `context/authContext.jsx`
- `middleware.js`
- `lib/auth/getSessionUser.js`
- `app/api/auth/*`

## Auth flow

1. `loginWithEmail()` signs in with Firebase Auth on the client.
2. `/api/auth/profile/create` creates or returns the Firestore user profile.
3. `/api/auth/login` exchanges the ID token for HTTP-only session cookies.
4. `AuthProvider` refreshes `/api/auth/me` and stores the session user.
5. Middleware and `RoleGuard` redirect the user to the correct workspace.

## Session rules

- Session cookies are server-managed.
- Session duration is five days in the current implementation.
- A second login invalidates the previous session through `activeSessionToken`.
- Pending profiles are allowed to finish onboarding but not to access normal app pages yet.

## Routes involved

| Route | Purpose |
| --- | --- |
| `/login` | Sign-in page |
| `/forgotpass` | Password-reset page |
| `/api/auth/checkEmail` | Email existence check |
| `/api/auth/profile/create` | Firestore profile bootstrap |
| `/api/auth/login` | Session creation |
| `/api/auth/me` | Session refresh |
| `/api/auth/logout` | Session termination |

## Notes for maintainers

- Keep client Firebase auth and server session logic separate.
- Any new protected API route should rely on `getSessionUser()` rather than custom cookie parsing.
- If login succeeds but the app immediately redirects away, inspect the Firestore `users/{uid}` document for role, status, barangay, and `activeSessionToken`.

## Related docs

- [API Overview](../../docs/api/overview.md)
- [Security and Access Control](../../docs/maintenance/security-access.md)
- [Firebase Configuration](../../docs/setup/firebase-configuration.md)
