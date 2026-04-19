# Retired Documentation Log

This log tracks Markdown files that were consolidated into the current maintained documentation set on 2026-04-14.

## Why these files were retired

The old repo contained many implementation reports, audits, and temporary notes that overlapped with each other. They were replaced by:

- shared operational docs under `docs/`
- one maintained `README.md` per real feature module

## Consolidation map

### Authentication reports

Retired:

- `AUTH_AUDIT_REPORT.md`
- `AUTH_IMPLEMENTATION_REPORT.md`
- `AUTH_INTEGRATION_MAP.md`
- `AUTH_QUICK_REFERENCE.md`
- `AUTH_SYSTEM_AUDIT.md`
- `AUTH_SYSTEM_GUIDE.md`

Replaced by:

- `features/Authentication/README.md`
- `docs/api/overview.md`
- `docs/maintenance/security-access.md`

### Firebase and Firestore notes

Retired:

- `FIREBASE_AUTH_MANUAL_STEPS.md`
- `FIREBASE_CONFIGURATION_COMPLETE.md`
- `FIREBASE_DEPLOYMENT_GUIDE.md`
- `FIREBASE_ERROR_CAPTURE_TESTING_GUIDE.md`
- `FIREBASE_QUOTA_ANALYSIS.md`
- `FIREBASE_SETUP_SUMMARY.md`
- `FIREBASE_TESTING_LIVE.md`
- `FIRESTORE_ERROR_HANDLER_IMPLEMENTATION.md`
- `FIRESTORE_INDEXES_COMPLETE_REFERENCE.md`
- `FIRESTORE_INDEXES_COMPOSITE.md`
- `FIRESTORE_NOT_FOUND_DIAGNOSTIC.md`
- `FIRESTORE_REAL_QUERY_ANALYSIS.md`

Replaced by:

- `docs/setup/development-setup.md`
- `docs/setup/firebase-configuration.md`
- `docs/deployment/deployment-checklist.md`
- `docs/maintenance/firestore-operations.md`

### Household and map implementation reports

Retired:

- `HOUSEHOLD_IMPLEMENTATION.md`
- `HOUSEHOLD_MODULE_COMPLETE_IMPLEMENTATION.md`
- `HOUSEHOLD_MODULE_FIXES.md`
- `HOUSEHOLD_SORTING_CORRECTIONS_APPLIED.md`
- `MAP_HOUSEHOLD_INTEGRATION_FIXES.md`
- `UPLOAD_ENHANCEMENT_GUIDE.md`

Replaced by:

- `features/Households/README.md`
- `features/Map/README.md`

### Feature-level duplicate docs

Retired:

- `features/Dashboard/API_REFERENCE.md`
- `features/Dashboard/FINALIZATION_SUMMARY.md`
- `features/Households/API_REFERENCE.md`
- `features/Households/FINALIZATION_SUMMARY.md`
- `features/Map/API_REFERENCE.md`

Replaced by:

- `features/Dashboard/README.md`
- `features/Households/README.md`
- `features/Map/README.md`

## Maintenance rule

If a future change needs documentation, prefer updating the current feature README or the shared `docs/` entry that owns the topic instead of creating another standalone implementation report at the repository root.
