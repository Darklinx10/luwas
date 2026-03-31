# Map Feature Module - API Reference

## Household Markers Endpoint

### GET /api/maps/household-markers

Fetch all household markers for map display with server-side filtering.

#### Authentication
- **Required**: Yes (session-based via `getSessionUser()`)
- **Allowed Roles**: MDRRMC-Admin, MDRRMC-Personnel, Brgy-Secretary

#### Query Parameters
None (all filtering is server-side automatic)

#### Response

```json
{
  "markers": [
    {
      "id": "household_0_0",
      "householdId": "HH-001",
      "homeIndex": 0,
      "homeLabel": "Primary Home",
      "headFullName": "Juan Dela Cruz",
      "headFirstName": "Juan",
      "headMiddleName": "",
      "headLastName": "Dela Cruz",
      "headSuffix": "",
      "barangay": "San Juan",
      "sitio": "Purok 1",
      "contactNumber": "09171234567",
      "lat": 14.5567,
      "lng": 121.3340,
      "totalResidents": 5,
      "totalMale": 2,
      "totalFemale": 3,
      "totalPWDs": 1,
      "totalSeniors": 0
    },
    {
      "id": "household_0_1",
      "householdId": "HH-001",
      "homeIndex": 1,
      "homeLabel": "Secondary Home",
      "headFullName": "Juan Dela Cruz",
      "barangay": "San Juan",
      "sitio": "Purok 2",
      "contactNumber": "09171234567",
      "lat": 14.5580,
      "lng": 121.3350,
      "totalResidents": 5,
      "totalMale": 2,
      "totalFemale": 3,
      "totalPWDs": 1,
      "totalSeniors": 0
    }
  ],
  "count": 2,
  "householdCount": 1,
  "barangayFilter": "San Juan"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `markers` | Array | Array of household home markers |
| `markers[].id` | String | Unique marker ID (`{householdId}_{homeIndex}`) |
| `markers[].householdId` | String | Parent household ID |
| `markers[].homeIndex` | Number | Index in homes[] array (0 = primary) |
| `markers[].homeLabel` | String | Display label (Primary Home, Secondary Home, etc.) |
| `markers[].headFullName` | String | Formatted household head name (uses fallback logic) |
| `markers[].headFirstName` | String | Head's first name (component for fallback) |
| `markers[].headMiddleName` | String | Head's middle name (component for fallback) |
| `markers[].headLastName` | String | Head's last name (component for fallback) |
| `markers[].headSuffix` | String | Head's suffix (Jr., Sr., etc.) |
| `markers[].barangay` | String | Barangay name |
| `markers[].sitio` | String | Sitio/purok name |
| `markers[].contactNumber` | String | Household contact number |
| `markers[].lat` | Number | Latitude coordinate (WGS84) |
| `markers[].lng` | Number | Longitude coordinate (WGS84) |
| `markers[].totalResidents` | Number | Total household residents |
| `markers[].totalMale` | Number | Male residents count |
| `markers[].totalFemale` | Number | Female residents count |
| `markers[].totalPWDs` | Number | Person with Disability count |
| `markers[].totalSeniors` | Number | Senior citizen count |
| `count` | Number | Total markers returned |
| `householdCount` | Number | Total unique households queried |
| `barangayFilter` | String or null | Applied barangay filter (Secretary only) |

#### Secretary Filtering

When user role is `Brgy-Secretary`:
- **Automatic**: Households are filtered server-side to user's assigned barangay
- **No client access**: Secretary cannot request other barangays (409 if attempted)
- **Transparent**: Client receives same response structure; `barangayFilter` field shows applied filter

#### Error Responses

**401 Unauthorized** - No valid session
```json
{
  "error": "Unauthorized: Authentication required"
}
```

**403 Forbidden** - Insufficient role or unconfigured secretary
```json
{
  "error": "Forbidden: Map access required"
}
```

OR

```json
{
  "error": "Forbidden: Secretary barangay is not configured"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to fetch household markers"
}
```

## Household Name Formatting (Client-Side Utility)

### formatHouseholdName(household)

Builds household display name with comprehensive fallback chain.

#### Usage

```javascript
import { formatHouseholdName } from '@/features/Map/utils/formatHouseholdName';

const name = formatHouseholdName(marker);
// Returns: "Juan Dela Cruz"
```

#### Priority Order

1. **headFullName** - Use if exists and non-empty
   - Example: "Juan Dela Cruz"

2. **Constructed Name** - Build from components if headFullName missing
   - Format: `{lastFame} {firstName} {middleName} {suffix}`
   - Example: "Dela Cruz Juan Dela Cruz"

3. **householdId** - Use if no name components available
   - Example: "HH-001"

4. **"Unnamed"** - Final fallback (should rarely occur)

#### Examples

```javascript
// Example 1: headFullName available
formatHouseholdName({
  householdId: 'HH-001',
  headFullName: 'Juan Dela Cruz',
  headFirstName: 'Juan',
  headLastName: 'Dela Cruz'
})
// Returns: "Juan Dela Cruz"

// Example 2: headFullName empty, use components
formatHouseholdName({
  householdId: 'HH-002',
  headFullName: '',
  headFirstName: 'Maria',
  headMiddleName: 'Santos',
  headLastName: 'Reyes',
  headSuffix: 'Jr.'
})
// Returns: "Reyes Maria Santos Jr."

// Example 3: All name fields empty, use householdId
formatHouseholdName({
  householdId: 'HH-003',
  headFullName: '',
  headFirstName: '',
  headLastName: ''
})
// Returns: "HH-003"

// Example 4: All fields empty
formatHouseholdName({})
// Returns: "Unnamed"
```

### formatHouseholdResidenceName(household)

Extends `formatHouseholdName()` with " Residence" suffix (for display context).

#### Usage

```javascript
const displayName = formatHouseholdResidenceName(marker);
// Returns: "Juan Dela Cruz's Residence"
```

#### Examples

```javascript
formatHouseholdResidenceName({ headFullName: 'Juan Dela Cruz' })
// Returns: "Juan Dela Cruz's Residence"

formatHouseholdResidenceName({ householdId: 'HH-001' })
// Returns: "HH-001's Residence"

formatHouseholdResidenceName({ headFullName: 'Unnamed' })
// Returns: "Unnamed"  // No "Residence" if already Unnamed
```

## Map State Management

### useMapState()

React hook for centralized map UI state.

#### Usage

```javascript
const {
  // Map selection
  activeMap,         // 'Household Map' | 'Accident Map'
  setActiveMap,
  isHouseholdMap,
  isAccidentMap,

  // Household interaction
  selectedHousehold,
  setSelectedHousehold,
  isModalOpen,
  setIsModalOpen,

  // Hazard management
  activeHazard,
  setActiveHazard,
  hazardGeoJSON,
  setHazardGeoJSON,
  affectedHouseholds,
  setAffectedHouseholds,
  legendProp,
  setLegendProp,
  colorSettings,
  setColorSettings,

  // Accident mode
  addingAccident,
  setAddingAccident,

  // Admin controls
  settingDefault,
  setSettingDefault,
  plusMarkers,
  setPlusMarkers,

  // File upload
  isUploadModalOpen,
  setIsUploadModalOpen,
  geojsonFile,
  setGeojsonFile,
  loading,
  setLoading
} = useMapState();
```

## Performance Characteristics

### Firestore Reads Per Map Load

**Single Request Pattern** (current optimized):
- 1 read: `households` collection query
- Result: ~0.3 quota points

**Multi-Home Support**:
- Homes[] array processed server-side into individual markers
- No additional queries per home

### Query Execution Time

- Average: 200-500ms for 500+ households
- With secretary filter: 50-150ms (smaller subset)

### Network Payload

- Typical response: 50-200KB (500+ households)
- All top-level fields included
- No nested subcollection data

## Caching Strategy

Currently: **No caching** (refresh on every map load)

Recommended for future:
- Client-side cache with 5-minute TTL
- Invalidate on household CRUD operations
- Service worker for offline support

## Related Endpoints

- `GET /api/households` - Household list (Dashboard/Management)
- `POST /api/accidents` - Submit accident report
- `GET /api/accidents` - Fetch accident list

