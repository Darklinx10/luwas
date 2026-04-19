# Firebase Configuration

LUWAS uses Firebase Authentication for login and Firestore for its primary data store. Client and server access are intentionally separated.

## Client SDK

Client-side Firebase setup lives in `lib/firebaseConfig.js`.

Required variables:

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web app auth |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket reference |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

## Admin SDK

Server-side Firebase setup lives in `lib/firebaseAdmin.js`.

Required variables:

| Variable | Used for |
| --- | --- |
| `FIREBASE_TYPE` | Service account credential type |
| `FIREBASE_PROJECT_ID` | Admin project ID |
| `FIREBASE_PRIVATE_KEY_ID` | Service account key ID |
| `FIREBASE_PRIVATE_KEY` | Service account private key |
| `FIREBASE_CLIENT_ID` | Service account client ID |
| `FIREBASE_CLIENT_EMAIL` | Service account email |
| `FIREBASE_DATABASE_ID` | Optional Firestore database ID override |

## Firestore database selection

The server SDK currently initializes Firestore with:

- `process.env.FIREBASE_DATABASE_ID`
- falling back to `default`

Use a value that matches the actual Firestore database ID in the Firebase project. A mismatch here can produce server-side `5 NOT_FOUND` errors even when the project and credentials are otherwise correct.

## Core Firestore collections

| Collection | Purpose |
| --- | --- |
| `users` | Roles, profile state, and active session token |
| `households` | Household summaries, homes coordinates, and counts |
| `households/{id}/members` | Household member records |
| `hazards/{type}/hazardInfo` | Stored hazard GeoJSON payloads and metadata |
| `accidents` | Accident reports for map and report views |
| `mapSettings/config` | Uploaded administrative boundary GeoJSON |
| `settings/mapCenter` | Default map center |

## Authentication configuration

The codebase assumes:

- Firebase email/password authentication is enabled.
- Server routes exchange Firebase ID tokens for HTTP-only session cookies.
- User profiles live in Firestore under `users/{uid}`.
- Newly created profiles start with `role: null` and `status: pending` until completion or admin assignment.

## Related docs

- [Development Setup](development-setup.md)
- [API Overview](../api/overview.md)
- [Security and Access Control](../maintenance/security-access.md)
