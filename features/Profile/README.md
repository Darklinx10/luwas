# Profile Feature

The profile feature handles profile viewing, self-service editing, and pending-profile completion.

## Routes and access

| Route | Purpose |
| --- | --- |
| `/profile` | Read-only profile view for authenticated users |
| `/profile/edit-profile` | Profile editing and initial completion flow |

Pending-profile users are redirected to `/profile/edit-profile` until their account is usable.

## Main files

```text
features/Profile/
  UserProfile.jsx
  Edit-Profile/
    EditUserProfile.jsx
  hooks/
    useUserProfile.js
  services/
    userProfileServices.js
```

## Supporting APIs

| Route | Purpose |
| --- | --- |
| `/api/auth/me` | Session-backed current user payload |
| `/api/profile/update` | Self-service profile read and update |

## Editable fields

The self-service flow is designed for personal profile data such as:

- first name
- middle name
- last name
- date of birth
- gender
- contact number
- profile photo string value

Important restrictions:

- Role changes are not self-service.
- Email changes are not handled by `/api/profile/update`.
- Secretaries cannot arbitrarily change their assigned barangay after activation.

## Maintenance notes

- `useUserProfile()` refreshes the session after successful updates.
- Blob-based temporary image URLs are intentionally not persisted by the server route.
- When onboarding behavior changes, review both middleware and `/api/profile/update`.
