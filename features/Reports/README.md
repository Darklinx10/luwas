# Reports Feature

The reports feature collects the report views used by personnel and secretaries.

## Route and access

- Page route: `/reports`
- Allowed roles: `MDRRMC-Personnel`, `Brgy-Secretary`

## Report tabs

- PWD
- Seniors
- Accidents
- Affected Households

## Main files

```text
features/Reports/
  components/
    Accidents/
    AffectedHouseholds/
    PWD/
    Seniors/
    Shared/
  hooks/
    useAffectedHouseholdsReport.js
    usePWDReport.js
    useSeniorsReport.js
  services/
    reportService.js
  index.js
```

## Supporting APIs

| Route | Notes |
| --- | --- |
| `/api/reports/pwd` | Supports `page`, `limit`, `search`, `exportAll` |
| `/api/reports/seniors` | Supports `page`, `limit`, `search`, `exportAll` |
| `/api/reports/affected-households` | Uses `hazardType` and returns all matched rows |
| `/api/accidents` | Supplies accident report data |
| `/api/accidents/[id]` | Accident detail and maintenance actions |

## Export and print behavior

- PWD and seniors can request full filtered export data through the API.
- Accident and affected-households views work from the full filtered datasets already held in the client.
- Report exports use the shared client export helpers in `lib/utils/clientExport.js`.

## Maintenance notes

- Secretary access is barangay-scoped through the server routes.
- The affected-households report depends on both valid hazard GeoJSON and valid household home coordinates.
- If an export or print flow drifts from what users see in the report, review the hook state, the service call, and the client export helper together.
