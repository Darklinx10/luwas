# Reports API Reference

Centralized API documentation for all report endpoints used by the Reports feature.

## Authentication

All endpoints require authentication. Include session cookies with requests:

```javascript
fetch('/api/reports/pwd', {
  credentials: 'include'
})
```

## Endpoints

### PWD Report

**GET `/api/reports/pwd`**

Fetch Persons with Disability (PWD) members report with pagination and search.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number (1-based) |
| limit | number | 20 | Results per page (max 100) |
| search | string | '' | Search by member name |

**Response:**
```json
{
  "success": true,
  "members": [
    {
      "memberId": "mem_123",
      "householdId": "hh_456",
      "firstName": "Juan",
      "middleName": "Dela",
      "lastName": "Cruz",
      "fullName": "Juan Dela Cruz",
      "age": 35,
      "sex": "Male",
      "barangay": "San Jose",
      "sitio": "Tagumpay",
      "contactNumber": "09123456789",
      "disabilityType": "Physical",
      "headFirstName": "Maria",
      "headLastName": "Cruz"
    }
  ],
  "totalMembers": 145,
  "totalPages": 8,
  "currentPage": 1,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

**Error Responses:**
- `400` - Invalid pagination parameters
- `401` - Unauthorized (not authenticated)
- `500` - Server error

---

### Seniors Report

**GET `/api/reports/seniors`**

Fetch Senior Citizens (age ≥ 60 or isSeniorCitizen = true) report with pagination.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number (1-based) |
| limit | number | 20 | Results per page (max 100) |
| search | string | '' | Search by member name |

**Response:**
```json
{
  "success": true,
  "members": [
    {
      "memberId": "mem_789",
      "householdId": "hh_456",
      "firstName": "Jose",
      "middleName": "",
      "lastName": "Garcia",
      "fullName": "Jose Garcia",
      "age": 72,
      "sex": "Male",
      "barangay": "San Jose",
      "sitio": "Bungad",
      "contactNumber": "09187654321",
      "birthdate": "1952-05-15",
      "headFirstName": "Julia",
      "headLastName": "Garcia"
    }
  ],
  "totalMembers": 89,
  "totalPages": 5,
  "currentPage": 1,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

**Error Responses:**
- `400` - Invalid pagination parameters
- `401` - Unauthorized
- `500` - Server error

---

### Accidents Report

**GET `/api/accidents`**

Fetch all accident records (no pagination on this endpoint).

**Response:**
```json
[
  {
    "id": "acc_001",
    "type": "Flood",
    "severity": "High",
    "description": "Heavy flooding in Barangay San Jose",
    "datetime": "2026-03-15T14:30:00Z",
    "imageUrl": "https://storage.firebase.com/accidents/...",
    "position": {
      "lat": 14.5531,
      "lng": 121.0243
    },
    "casualties": 0
  }
]
```

**Error Responses:**
- `401` - Unauthorized
- `500` - Server error

---

### Hazard Report

**GET `/api/hazards/:type`**

Fetch hazard data (GeoJSON) for a specific hazard type (e.g., flood, landslide).

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Hazard type (url-encoded) |

**Response:**
```json
{
  "type": "FeatureCollection",
  "legendProp": {
    "key": "susceptibility",
    "type": "numeric"
  },
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lng, lat], [lng, lat], ...]]
      },
      "properties": {
        "susceptibility": 0.85,
        "area": "High Risk Zone"
      }
    }
  ]
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Hazard type not found
- `500` - Server error

---

### Update PWD Member

**PATCH `/api/members/:memberId`**

Update PWD member record.

**Request Body:**
```json
{
  "disabilityType": "Visual",
  "firstName": "Juan",
  "lastName": "Cruz"
}
```

**Response:**
```json
{
  "success": true,
  "member": {
    "memberId": "mem_123",
    "disabilityType": "Visual",
    "firstName": "Juan",
    "lastName": "Cruz"
  }
}
```

**Error Responses:**
- `400` - Invalid data
- `401` - Unauthorized
- `404` - Member not found
- `500` - Server error

---

### Remove PWD Status

**DELETE `/api/members/:memberId/removePWD`**

Remove PWD status from a member.

**Response:**
```json
{
  "success": true,
  "message": "PWD status removed"
}
```

---

### Update Senior Citizen

**PATCH `/api/members/:memberId`**

Update Senior Citizen record.

**Request Body:**
```json
{
  "age": 73,
  "sex": "Male",
  "barangay": "San Jose"
}
```

**Response:**
```json
{
  "success": true,
  "member": { ... }
}
```

---

### Remove Senior Status

**DELETE `/api/members/:memberId/removeSenior`**

Remove Senior Citizen status from a member.

**Response:**
```json
{
  "success": true,
  "message": "Senior status removed"
}
```

---

## Data Models

### PWD Member

```typescript
interface PWDMember {
  memberId: string;           // Unique member ID
  householdId: string;        // Parent household ID
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  age?: number;
  sex: "Male" | "Female";
  barangay: string;
  sitio: string;
  contactNumber: string;
  disabilityType?: string;
  headFirstName: string;      // Household head
  headLastName: string;
}
```

### Senior Member

```typescript
interface SeniorMember {
  memberId: string;
  householdId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  age: number;
  sex: "Male" | "Female";
  barangay: string;
  sitio: string;
  contactNumber: string;
  birthdate?: string;
  headFirstName: string;
  headLastName: string;
}
```

### Accident

```typescript
interface Accident {
  id: string;
  type: string;              // e.g., "Flood", "Earthquake"
  severity: "Critical" | "High" | "Medium" | "Low";
  description: string;
  datetime: string;          // ISO 8601 format
  imageUrl?: string;
  position?: {
    lat: number;
    lng: number;
  };
  casualties?: number;
}
```

### Hazard GeoJSON Feature

```typescript
interface HazardFeature {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: number[][][];  // [[[lng, lat], ...]]
  };
  properties: {
    [key: string]: any;
    susceptibility?: number;    // Common property: 0-1
  };
}
```

### Affected Household (from hazard intersection)

```typescript
interface AffectedHousehold {
  name: string;               // Head name
  barangay: string;
  sitio: string;
  contactNumber: string;
  location: {
    lat: number;
    lng: number;
  };
  homeLabel: string;          // e.g., "Primary Home"
  [legendKey: string]: any;   // Dynamic property from hazard
}
```

---

## Rate Limiting

- PWD/Seniors endpoints: 30 requests per minute
- Accidents endpoint: 20 requests per minute
- Hazard endpoints: 15 requests per minute

## Pagination

All paginated endpoints use cursor-based pagination for efficiency. Maximum `limit` is 100.

```javascript
// Request page 2
const response = await fetchPWDReport({
  page: 2,
  limit: 20,
  search: 'cruz'
});

// Navigate to next page
const { hasNextPage, totalPages } = response;
if (hasNextPage) {
  // go to page 3
}
```

## Error Handling

All endpoints follow this error response format:

```json
{
  "error": "Error message describing what went wrong",
  "status": 400
}
```

Common HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (not authenticated or session expired)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Service Integration

The `reportApi.js` service module wraps all these endpoints with automatic error handling:

```javascript
import {
  fetchPWDReport,
  fetchSeniorsReport,
  fetchAccidents,
  fetchHazardReport,
  updatePWDMember,
  removePWDStatus,
  updateSeniorCitizen,
  removeSeniorStatus
} from '@/features/Reports/services/reportApi';

// Usage
try {
  const { members, totalPages } = await fetchPWDReport({
    page: 1,
    limit: 20,
    search: 'juan'
  });
} catch (error) {
  console.error('Failed to fetch PWD report:', error.message);
}
```

## See Also

- [Reports Feature README](README.md)
- [Reports Implementation Summary](FINALIZATION_SUMMARY.md)
