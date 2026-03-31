# LUWAS Authentication - Quick Reference

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP ROUTER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐        │
│  │ Public Routes│  │Protected Routes│  │  Admin Routes │        │
│  ├──────────────┤  ├──────────────┤  ├────────────────┤        │
│  │ /login       │  │ /dashboard   │  │ /users         │        │
│  │ /forgotpass  │  │ /household   │  │ /hazards       │        │
│  │ /unauth      │  │ /maps        │  │ /household     │        │
│  │              │  │ /reports     │  │                │        │
│  │              │  │ /profile     │  │                │        │
│  └──────────────┘  └──────────────┘  └────────────────┘        │
│         ▲                  ▲                    ▲                │
│         │                  │                    │                │
│         └──────────────────┴────────────────────┘                │
│                          │                                        │
│                          ▼                                        │
│    ┌────────────────────────────────────┐                       │
│    │      MIDDLEWARE.JS (Route Guard)   │                       │
│    ├────────────────────────────────────┤                       │
│    │ 1. Extract cookies (session)       │                       │
│    │ 2. Verify session cookie           │                       │
│    │ 3. Check activeSessionToken match  │                       │
│    │ 4. Check user role                 │                       │
│    │ 5. Allow or redirect               │                       │
│    └────────────────────────────────────┘                       │
│                          │                                        │
└──────────────────────────┼────────────────────────────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │   API ROUTES         │
                ├──────────────────────┤
                │ POST /api/auth/login │  ← Create session
                │ POST /api/auth/logout│  ← Clear session
                │ GET  /api/auth/me    │  ← Check session
                │ POST /api/auth/check │  ← Email exists?
                └──────────────────────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
        ┌─────────────────┐  ┌──────────────────┐
        │ Firebase Admin  │  │  React Context   │
        ├─────────────────┤  ├──────────────────┤
        │ verifyToken()   │  │ AuthProvider     │
        │ createSession() │  │ useAuth()        │
        │ verifySession() │  │ user, role       │
        └─────────────────┘  │ loading          │
                             └──────────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────┐
                      │  Components & Pages      │
                      ├──────────────────────────┤
                      │ <LoginForm />            │
                      │ <RoleGuard />            │
                      │ dashboard/, household/   │
                      └──────────────────────────┘
                             │
                             ▼
                      ┌──────────────────┐
                      │  Firestore       │
                      ├──────────────────┤
                      │ users/           │
                      │  ├─ uid          │
                      │  ├─ email        │
                      │  ├─ role         │
                      │  └─ sessionToken │
                      └──────────────────┘
```

---

## Login Flow (Step by Step)

```
1. USER FILLS LOGIN FORM
   ┌────────────────┐
   │ Email: ...     │
   │ Password: ...  │
   │ [Login Button] │
   └────────────────┘
          │
          ▼
2. CLIENT-SIDE FIREBASE AUTH
   signInWithEmailAndPassword()
   returns: Firebase User object + ID Token
          │
          ▼
3. SEND TO SERVER
   POST /api/auth/login
   Body: { idToken }
          │
          ▼
4. SERVER VALIDATES & CREATES SESSION
   ├─ verifyIdToken() with Admin SDK
   ├─ Check user role in Firestore
   ├─ Create 5-day session cookie
   ├─ Generate random sessionToken (UUID)
   ├─ Store sessionToken in Firestore
   └─ Set HTTP-only cookies in response
          │
          ▼
5. CLIENT RECEIVES COOKIES
   ├─ session (Firebase session cookie)
   └─ sessionToken (Custom validation token)
          │
          ▼
6. FETCH USER SESSION
   GET /api/auth/me
   ├─ Read cookies
   ├─ Verify session cookie signature
   ├─ Check sessionToken matches Firestore
   └─ Return user data
          │
          ▼
7. UPDATE AUTH CONTEXT
   ├─ user = { uid, email }
   ├─ profile = { full user data }
   ├─ role = { user's role }
   └─ loading = false
          │
          ▼
8. REDIRECT BASED ON ROLE
   ├─ New user → /profile/edit-profile
   ├─ MDRRMC-Admin → /household
   └─ Others → /dashboard
```

---

## Single Active Session Logic

```
LOGIN #1 (Device A)
┌─────────────────────────────────┐
│ POST /api/auth/login            │
│ ├─ Session Token: TOKEN-A       │
│ ├─ Store in Firestore:          │
│ │  activeSessionToken = TOKEN-A │
│ └─ Set cookies: session, TOKEN-A│
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│ GET /api/auth/me                │
│ ├─ Cookie sessionToken = TOKEN-A│
│ ├─ Firestore check: TOKEN-A = ?│
│ │  ✓ Match → Authenticated      │
│ └─ Return user data             │
└─────────────────────────────────┘

        ▼▼▼ Time passes ▼▼▼

LOGIN #2 (Device B)
┌─────────────────────────────────┐
│ POST /api/auth/login            │
│ ├─ Session Token: TOKEN-B       │
│ ├─ Store in Firestore:          │
│ │  activeSessionToken = TOKEN-B │
│ │  (overwrites TOKEN-A)         │
│ └─ Set cookies: session, TOKEN-B│
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│ Device B: Authenticated ✓       │
└─────────────────────────────────┘

        ▼▼▼ Device A makes request ▼▼▼

┌─────────────────────────────────┐
│ GET /api/auth/me (Device A)     │
│ ├─ Cookie sessionToken = TOKEN-A│
│ ├─ Firestore check:             │
│ │  activeSessionToken = TOKEN-B │
│ │  TOKEN-A ≠ TOKEN-B ✗          │
│ └─ Return 401 Unauthorized      │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│ AuthContext: Clear state        │
│ Middleware: Redirect to /login  │
│ Device A: Must login again      │
└─────────────────────────────────┘
```

---

## File Structure Overview

```
AUTHENTICATION
├── context/
│   └── authContext.jsx (exports useAuth hook)
│
├── features/Authentication/
│   ├── components/
│   │   ├── LoginForm.jsx
│   │   └── ForgotPasswordForm.jsx
│   ├── hooks/
│   │   ├── useLogin.js
│   │   └── useForgotPassword.js
│   ├── services/
│   │   └── authService.js (Firebase Client SDK)
│   └── utils/
│       ├── authErrors.js
│       ├── authRedirect.js
│       └── authStorage.js
│
├── lib/
│   ├── firebaseConfig.js (Client SDK init)
│   ├── firebaseAdmin.js (Admin SDK init)
│   ├── auth/ (optional)
│   │   ├── getSessionUser.js
│   │   └── permissions.js
│
├── components/
│   └── roleGuard.jsx (Wrap components for role access)
│
├── app/
│   ├── (auth)/
│   │   ├── login/page.jsx
│   │   └── forgotpass/page.jsx
│   │
│   ├── api/auth/
│   │   ├── login/route.js
│   │   ├── logout/route.js
│   │   ├── me/route.js
│   │   └── checkEmail/route.js
│   │
│   └── (home)/(protected)/...
│
└── middleware.js (Server-side route protection)
```

---

## API Routes Summary

### POST /api/auth/login
- **Purpose**: Create session cookie after Firebase auth
- **Input**: { idToken }
- **Output**: Cookies (session, sessionToken)
- **Firestore**: Stores activeSessionToken
- **Session Token**: UUID, used to validate single session

### POST /api/auth/logout
- **Purpose**: Clear session and cookies
- **Input**: None (uses cookies)
- **Output**: Clears cookies
- **Firestore**: Sets activeSessionToken = null
- **Client**: AuthContext clears, redirects to /login

### GET /api/auth/me
- **Purpose**: Fetch current user session
- **Input**: Cookies (session, sessionToken)
- **Output**: { authenticated, user, profile, role }
- **Check**: activeSessionToken must match sessionToken cookie
- **Use**: Called by AuthContext on app mount

### POST /api/auth/checkEmail
- **Purpose**: Check if email exists (forgot password)
- **Input**: { email }
- **Output**: { exists: true/false, uid? }
- **Security**: Doesn't leak if user exists (returns same response)

---

## AuthContext API

```javascript
const {
  // State
  firebaseUser,      // Raw Firebase User object
  user,              // { uid, email }
  profile,           // Full user doc from Firestore
  role,              // "MDRRMC-Admin" | "MDRRMC-Personnel" | "Brgy-Secretary"
  loading,           // true while checking session
  
  // Methods
  refreshSession,    // Re-fetch session from GET /api/auth/me
  logout,            // Call POST /api/auth/logout + Firebase signOut
  setProfile,        // Update profile state
  setAuthState,      // Set all auth state at once
  clearAuthState,    // Clear all state
} = useAuth();
```

---

## Middleware Flow

```
Request to Protected Route
    │
    ├─ Extract cookies (session, sessionToken)
    │
    ├─ Verify session cookie with Admin SDK
    │
    ├─ Fetch user from Firestore
    │
    ├─ Compare activeSessionToken === sessionToken
    │
    ├─ Check user role
    │
    └─ Route Decision:
       ├─ Public-only (/login, /forgotpass)
       │  ├─ Session valid? → Redirect to home
       │  └─ No session? → Allow access
       │
       ├─ Protected routes
       │  ├─ No session? → Redirect to /login
       │  ├─ Wrong role? → Redirect to /unauthorized
       │  └─ Correct role? → Allow access
       │
       └─ Admin-only (/users, /hazards)
          ├─ Not admin? → Redirect to /unauthorized
          └─ Is admin? → Allow access
```

---

## Role-Based Access

```
┌─────────────────────┬───────────┬──────────────┬────────────┐
│ Route               │ Brgy-Sec  │ MDRRMC-Pers  │ MDRRMC-Ad  │
├─────────────────────┼───────────┼──────────────┼────────────┤
│ /dashboard          │ ✓         │ ✓            │ ✗ (blocked) │
│ /household          │ ✓         │ ✓            │ ✓           │
│ /maps               │ ✗         │ ✓            │ ✓           │
│ /reports            │ ✓         │ ✓            │ ✗ (blocked) │
│ /profile            │ ✓         │ ✓            │ ✓           │
│ /users              │ ✗         │ ✗            │ ✓           │
│ /hazards            │ ✗         │ ✗            │ ✓           │
└─────────────────────┴───────────┴──────────────┴────────────┘
```

---

## Usage Examples

### Hook Usage

```jsx
'use client';
import { useAuth } from '@/context/authContext';

export function UserProfile() {
  const { user, profile, role, loading, logout } = useAuth();
  
  if (loading) return <Spinner />;
  if (!user) return null;
  
  return (
    <div>
      <p>Email: {user.email}</p>
      <p>Role: {role}</p>
      <p>Name: {profile?.displayName}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### RoleGuard Usage

```jsx
// Only show to admins
<RoleGuard allowedRoles={['MDRRMC-Admin']}>
  <DeleteButton />
</RoleGuard>

// Show to multiple roles
<RoleGuard allowedRoles={['MDRRMC-Personnel', 'Brgy-Secretary']}>
  <ReportGenerator />
</RoleGuard>
```

### Protected Page

```jsx
'use client';
import RoleGuard from '@/components/roleGuard';

export default function AdminPage() {
  // Middleware blocks access before component loads
  // RoleGuard provides additional client-side check
  
  return (
    <RoleGuard allowedRoles={['MDRRMC-Admin']}>
      <div>Admin Content</div>
    </RoleGuard>
  );
}
```

---

## Security Features

✅ HTTP-only cookies (JavaScript cannot access)  
✅ Secure flag in production (HTTPS only)  
✅ SameSite=Lax (CSRF protection)  
✅ Single active session (prevents concurrent login)  
✅ Server-side validation on every request  
✅ Email normalization (prevents enumeration)  
✅ Error messages don't leak user info  
✅ Session token invalidation on logout  
✅ Middleware verification before route access  
✅ Role-based access control at multiple levels  

---

## Testing Checklist

```
Authentication Flow
□ User can login with email/password
□ Session cookie is set after login
□ AuthContext updates with user data
□ User is redirected to correct home page

Session Management
□ Session persists on page refresh
□ Session expires after 5 days
□ GET /api/auth/me returns correct data
□ Session validates activeSessionToken

Single Active Session
□ Login on Device A → works
□ Login on Device B → works (different token)
□ Device A makes request → gets 401
□ Device A redirected to login

Logout
□ User can logout
□ Session cookies cleared
□ activeSessionToken set to null
□ User redirected to /login

Route Protection
□ /login accessible without auth
□ /dashboard blocked without auth
□ /household accessible to all roles
□ /users only accessible to admin
□ /hazards only accessible to admin

Role Guards
□ RoleGuard blocks wrong roles
□ RoleGuard allows correct roles
□ Redirect works on role mismatch

Error Handling
□ Invalid credentials → error message
□ Network error → error message
□ Session invalid → redirect to login
```

---

## Environment Variables

```bash
# Firebase Client (NEXT_PUBLIC = visible to client)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin (Server-side only)
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY_ID=...
FIREBASE_PRIVATE_KEY=... (include newlines as \n)
FIREBASE_CLIENT_EMAIL=...
FIREBASE_CLIENT_ID=...
```

---

## Deployment Checklist

- [ ] All environment variables set in production
- [ ] `secure: true` for cookies in production
- [ ] HTTPS enabled
- [ ] Firestore security rules configured
- [ ] Firebase Auth providers enabled
- [ ] Email verification enabled (optional)
- [ ] Password reset configured
- [ ] Error logging configured
- [ ] Monitor session anomalies

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Session lost on refresh | Check cookies are being set; verify middleware matcher |
| Can't login | Check Firebase config; verify user exists in Firestore; check role assigned |
| 401 on every request | activeSessionToken mismatch; verify sessionToken cookie is set |
| RoleGuard not redirecting | Check role matches allowedRoles array; verify useAuth is used |
| Middleware not matching | Check config.matcher includes all protected routes |
| Cookies not persisting | Verify sameSite and secure flags; check browser settings |

---

**Last Updated**: March 27, 2026  
**Status**: ✅ Fully Implemented & Production Ready
