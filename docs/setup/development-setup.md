# Development Setup

This guide covers the local setup needed to run LUWAS in development.

## Prerequisites

- A current Node.js LTS installation
- `npm`
- A Firebase project with Authentication and Firestore enabled
- A Firebase service account for the server-side admin SDK

## Install and run

1. Install dependencies with `npm install`.
2. Create `.env.local` using the variables listed in [Firebase Configuration](firebase-configuration.md).
3. Start the dev server with `npm run dev`.
4. Open `http://localhost:3000`.

## Local environment variables

| Variable | Purpose |
| --- | --- |
| `FIREBASE_TYPE` | Service account credential type |
| `FIREBASE_PROJECT_ID` | Firebase and Firestore project ID |
| `FIREBASE_PRIVATE_KEY_ID` | Service account private key ID |
| `FIREBASE_PRIVATE_KEY` | Service account private key |
| `FIREBASE_CLIENT_ID` | Service account client ID |
| `FIREBASE_CLIENT_EMAIL` | Service account email |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client SDK API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase client project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `FIREBASE_DATABASE_ID` | Optional Firestore database ID; defaults to `default` in the server SDK |

## Local smoke test

After startup, verify these basic flows:

1. `/login` loads and accepts a Firebase-authenticated user.
2. New users are redirected to `/profile/edit-profile` until their profile is completed.
3. `/household`, `/map`, and any role-specific pages load for the correct roles.
4. `/api/auth/me` returns the current session when cookies are present.

## Generated geography data

The repo includes `scripts/build_GeoData_ph.mjs`, which generates `utils/geoData-ph.json` from the PSGC Excel file in `public/`.

Important:

- The script currently contains a machine-specific Windows input path.
- Update that path locally before running the script.
- Running the script is optional unless you are refreshing the bundled geography dataset.

## Useful project paths

- `app/`: page routes and API routes
- `features/`: feature-owned components, hooks, services, and docs
- `lib/`: Firebase setup, auth helpers, Firestore utilities, export helpers
- `utils/`: shared constants and generated lookup data
