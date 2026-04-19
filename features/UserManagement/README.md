# User Management Feature

The user management feature is the admin workspace for managing non-admin user accounts.

## Route and access

- Page route: `/users`
- Allowed role: `MDRRMC-Admin`

## Main files

```text
features/UserManagement/
  UserManagement.jsx
  components/
    UserModal.jsx
    UserTable.jsx
  hooks/
    useUsers.js
  services/
    userService.js
```

## Supporting APIs

| Route | Purpose |
| --- | --- |
| `/api/users` | List users and create new users |
| `/api/users/[userId]` | Fetch, update, or delete a single user |

## Current behavior

- Lists users with pagination and search
- Creates `Brgy-Secretary` and `MDRRMC-Personnel` accounts
- Updates editable profile fields for managed users
- Deletes Firebase Auth users and Firestore profiles together

## Constraints

- This workflow does not create other admins.
- PATCH does not allow editing email, password, role, status, or created timestamps.
- Search and sorting are handled server-side plus client state in the feature hook.

## Maintenance notes

- Keep validation rules aligned between `userService.js` and the server routes.
- If user creation fails after Auth succeeds, inspect both Firebase Auth and the `users` collection for partial state.
