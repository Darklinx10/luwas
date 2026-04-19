# Deployment Checklist

Use this checklist before promoting LUWAS to a shared environment.

## Environment and secrets

- Confirm all Firebase client and admin variables are present.
- Confirm the server credentials belong to the same Firebase project as the client credentials.
- If used, confirm `FIREBASE_DATABASE_ID` matches the actual Firestore database ID.
- Store secrets outside source control.

## Firebase services

- Enable Firebase Authentication email/password sign-in.
- Confirm Firestore is initialized for the target project.
- Confirm the service account has the Firestore access needed by the server routes.
- Ensure at least one `MDRRMC-Admin` user exists in Firebase Auth and Firestore.

## Application validation

- Run `npm run build` successfully for the target environment.
- Verify production cookie behavior with HTTPS-enabled deployment.
- Confirm image domains in `next.config.js` match the deployment needs.

## Data and configuration checks

- Verify `users`, `households`, `hazards`, and `accidents` collections are available.
- Verify `mapSettings/config` and `settings/mapCenter` are initialized if the map admin workflow is expected.
- Rebuild missing Firestore indexes when routes report `FAILED_PRECONDITION`.

## Post-deploy smoke tests

1. Log in with a known working account.
2. Confirm root redirect behavior for admin vs non-admin users.
3. Complete pending-profile onboarding if testing a new account.
4. Open `/household`, `/map`, and the role-appropriate pages.
5. Confirm `/api/auth/me` returns the expected session user.
6. Verify at least one report loads.

## Rollback notes

- Session behavior depends on both Firebase Auth and Firestore profile state.
- If login succeeds but app access fails, inspect `users/{uid}` for role, status, barangay, and `activeSessionToken`.
- See [Firestore Operations](../maintenance/firestore-operations.md) for common diagnostics.
