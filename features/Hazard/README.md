# Hazard Feature

The hazard feature manages uploaded hazard datasets and provides hazard data to the map and affected-households report.

## Route and access

- Page route: `/hazards`
- Page access: `MDRRMC-Admin` only
- API read access: all authenticated system roles
- API write access: `MDRRMC-Admin` only

## Main files

```text
features/Hazard/
  hooks/
    useHazardViewModel.js
  services/
    hazardService.js
  index.js
```

The admin page UI also uses components under `app/(home)/(admin)/hazards/components/`.

## Storage model

Hazards are stored in Firestore as:

```text
hazards/
  {hazardType}/
    hazardInfo/
      {docId}
```

Each record can include:

- `type`
- `description`
- `geojsonData`
- `features`
- `legendProp`
- `colorSettings`
- `createdAt`

## Supported hazard types

The admin API validates against the hazard types defined in `utils/hazardTypes.js`:

- Active Faults
- Earthquake Induced Landslide
- Storm Surge
- Tsunami
- Rain Induced Landslide
- Ground Shaking
- Liquefaction

## Related consumers

- `/api/hazards?type=...` for merged map/report-ready hazard data
- `/api/reports/affected-households` for spatial household impact analysis
- the map workspace for hazard overlays

## Maintenance notes

- The hazard upload API accepts GeoJSON payloads and enforces server-side validation.
- If a hazard appears in Firestore but not in the admin uploader, verify it is part of `utils/hazardTypes.js`.
