# Dashboard Feature

The dashboard provides summary analytics for households, residents, map coverage, hazards, and accidents.

## Route and access

- Page route: `/dashboard`
- Allowed roles: `Brgy-Secretary`, `MDRRMC-Personnel`

## Main files

```text
features/Dashboard/
  components/
    SummaryCard.jsx
    BottomStat.jsx
    BarChart.jsx
    AgeBracketChart.jsx
    Spinner.jsx
  hooks/
    useDashboard.js
  services/
    dashboardService.js
  index.js
```

## Data source

The dashboard loads through `GET /api/dashboard`.

Important behavior:

- Secretaries are filtered to their assigned barangay.
- Aggregation uses top-level household summary fields instead of scanning every member document.
- Hazard and accident totals are read separately from their own collections.

## What the page shows

- Total residents
- Total households
- Total families
- Mapped households
- Male and female distribution
- Total PWDs
- Total seniors
- Hazard and accident totals
- Residents by barangay
- Age bracket distribution

## Maintenance notes

- If dashboard numbers drift, verify household aggregate fields are still being recalculated correctly by the household and member flows.
- Prefer extending the existing `/api/dashboard` response instead of adding multiple small dashboard-only endpoints.
