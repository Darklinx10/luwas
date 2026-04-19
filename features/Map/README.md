# Map Feature

The map feature is the geospatial workspace for households, accidents, boundaries, and hazard overlays.

## Route and access

- Page route: `/map`
- Allowed roles: `MDRRMC-Admin`, `MDRRMC-Personnel`, `Brgy-Secretary`

## Main files

```text
features/Map/
  components/
    Accident/
    Admin/
    Hazard/
    Household/
    Map/
    Shared/
  hooks/
    useMapState.js
    useHouseholdMarkers.js
    useAccidents.js
  services/
    mapApi.js
  utils/
    formatHouseholdName.js
    groupNearbyAccidents.js
    icons.js
    mapConstants.js
  index.js
```

## Core map modes

- Household map
- Accident map

## Supporting APIs

| Route | Purpose |
| --- | --- |
| `/api/maps/household-markers` | Ready-to-render household marker data |
| `/api/accidents` | Accident list and creation |
| `/api/accidents/[id]` | Accident detail, update, delete |
| `/api/maps/boundary` | Boundary fetch and admin upload |
| `/api/maps/settings/default-center` | Default-center fetch and admin update |
| `/api/hazards` | Hazard summaries and merged hazard datasets |

## Admin-only map controls

Admins can:

- upload administrative boundary GeoJSON
- set the default map center

If no boundary or saved map center exists, the API returns empty or fallback values instead of failing.

## Data dependencies

- household homes coordinates from `households`
- accident records from `accidents`
- hazard polygons from `hazards/{type}/hazardInfo`
- boundary data from `mapSettings/config`
- default center from `settings/mapCenter`

## Maintenance notes

- Keep new map data flows aligned with `mapApi.js` instead of fetching directly from components.
- The affected-households report shares the same household home coordinates and hazard polygons used by the map feature.
- Household marker loading is intentionally optimized to avoid member-by-member reads on initial map load.
