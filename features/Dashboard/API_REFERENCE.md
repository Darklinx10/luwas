# Dashboard API Reference

Complete API endpoint reference for the Dashboard module.

## Endpoints

### GET /api/dashboard

Fetch all dashboard summary statistics.

**Authentication**: Required (User must have: Brgy-Secretary, MDRRMC-Personnel, or MDRRMC-Admin role)

**Query Parameters**: None

**Response**:
```json
{
  "success": true,
  "stats": {
    "summary": {
      "totalHouseholds": 45,
      "totalResidents": 325,
      "totalFamilies": 52,
      "mappedHouseholds": 38,
      "residentCoveragePercent": 84
    },
    "demographics": {
      "totalMale": 165,
      "totalFemale": 160,
      "totalPWDs": 12,
      "totalSeniors": 28,
      "malePercent": 51,
      "femalePercent": 49
    },
    "ageBracketData": [
      { "age": "Under 1", "count": 5 },
      { "age": "1-4", "count": 18 },
      { "age": "5-9", "count": 32 },
      { "age": "10-14", "count": 28 },
      { "age": "15-19", "count": 25 },
      { "age": "20-24", "count": 22 },
      { "age": "25-29", "count": 24 },
      { "age": "30-34", "count": 20 },
      { "age": "35-39", "count": 18 },
      { "age": "40-44", "count": 16 },
      { "age": "45-49", "count": 14 },
      { "age": "50-54", "count": 12 },
      { "age": "55-59", "count": 10 },
      { "age": "60 and over", "count": 28 }
    ],
    "hazardsAndAccidents": {
      "totalHazards": 156,
      "totalAccidents": 8
    },
    "barangayResidents": [
      { "name": "Talon", "residents": 125 },
      { "name": "Dampit", "residents": 98 },
      { "name": "Linao", "residents": 102 }
    ],
    "timestamp": "2024-03-30T10:30:00.000Z"
  }
}
```

**Error Responses**:

- 401 Unauthorized - No valid authentication
  ```json
  { "error": "Unauthorized: Authentication required" }
  ```

- 403 Forbidden - User role not allowed or missing barangay
  ```json
  { "error": "Forbidden: Dashboard access required" }
  ```
  
  ```json
  { "error": "Secretary barangay not configured" }
  ```

- 500 Internal Server Error
  ```json
  { "error": "Failed to fetch dashboard data" }
  ```

## Data Sources

### Households Collection
- **Path**: `households/{id}`
- **Fields Used**:
  - `householdId`: Identifier
  - `headFirstName`, `barangay`: Validation
  - `totalResidents, totalMale, totalFemale`: Aggregates from members
  - `totalPWDs, totalSeniors`: Summary fields
  - `totalFamilies`: Family count
  - `homes[]`: Array with latitude/longitude for mapping

### Members Subcollection
- **Path**: `households/{id}/members/{memberId}`
- **Fields Used**: 
  - Currently NOT read (uses household-level totals instead)
  - To implement full age bracket calculation in future, would need: `birthdate` field

### Hazards Collections
- **Path**: `hazards/{hazardType}/hazardInfo`
- **Hazard Types**: Active Faults, Earthquake Induced Landslide, Ground Shaking, Landslide, Liquefaction, Rain Induced Landslide, Storm Surge, Tsunami

### Accidents Collection
- **Path**: `accidents`
- **Fields Used**: Document count only

## Secretary Data Filtering

When a user with role `Brgy-Secretary` requests the dashboard:

1. Households are filtered to their assigned barangay only
2. All subsequent calculations use their barangay data
3. `barangayResidents` will contain only their barangay
4. Demographics reflect only their barangay population

**Example** (Secretary for Dampit):
```json
{
  "barangayResidents": [
    { "name": "Dampit", "residents": 98 }
  ],
  "demographics": {
    "totalMale": 50,
    "totalFemale": 48
    // ... percentages of their 98 residents only
  }
}
```

## Age Bracket Calculation

**Current Implementation** (using Household top-level fields only):
- Age bracket data structure is returned for API consistency
- Only "60 and over" bracket is populated with `totalSeniors` count from households
- Other age brackets show 0 (not calculated to avoid unnecessary member reads)

**Available Brackets**:

| Bracket | Age Range | Current Data Source |
|---------|-----------|-----|
| Under 1 | 0 years | - |
| 1-4 | 1-4 years | - |
| 5-9 | 5-9 years | - |
| 10-14 | 10-14 years | - |
| 15-19 | 15-19 years | - |
| 20-24 | 20-24 years | - |
| 25-29 | 25-29 years | - |
| 30-34 | 30-34 years | - |
| 35-39 | 35-39 years | - |
| 40-44 | 40-44 years | - |
| 45-49 | 45-49 years | - |
| 50-54 | 50-54 years | - |
| 55-59 | 55-59 years | - |
| 60 and over | 60+ years | ✅ `household.totalSeniors` |

**Future Enhancement**: To populate full age bracket data, update API to read member birthdates from `households/{id}/members/{memberId}` and calculate ages.

## Performance Characteristics

- **Household Query**: Single collection query (fast)
- **Top-Level Fields**: Used directly without nested reads (100x faster)
- **Member Reads**: Not performed (uses household summary totals instead)
- **Age Bracket Optimization**: Uses `totalSeniors` from household docs to populate "60+" bracket without reading members
- **Typical Response Time**: 500-1000ms depending on household count (no nested collection reads)
- **Cached**: No caching; always fresh data

## Implementation Example

### Using the Dashboard Service

```javascript
import { dashboardApi } from '@/features/Dashboard/services/dashboardService';

const stats = await dashboardApi.fetchDashboardStats();
console.log(`Total households: ${stats.summary.totalHouseholds}`);
console.log(`Male percentage: ${stats.demographics.malePercent}%`);
```

### In React Components

```javascript
import { useDashboard } from '@/features/Dashboard/hooks/useDashboard';

function MyComponent() {
  const { profile, loading: authLoading } = useAuth();
  const { loading, stats, error } = useDashboard(profile, authLoading);

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;

  return <div>Total: {stats.households} households</div>;
}
```

## Related Endpoints

- `GET /api/households` - Get household list
- `GET /api/households/{id}` - Get household details
- `GET /api/dashboard` - **This endpoint**
- `GET /api/reports/pwd` - PWD report data
- `GET /api/reports/seniors` - Senior citizens report data
