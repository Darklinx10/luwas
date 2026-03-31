# LUWAS Household Module - API Quick Reference

## Endpoints Summary

### Households

| Method | Path | Purpose | Auth | Notes |
|--------|------|---------|------|-------|
| GET | `/api/households` | List households | Required | Paginated, searchable, Secretary filtered |
| POST | `/api/households` | Create household | Secretary, Admin | Requires barangay validation |
| GET | `/api/households/{id}` | Get household | Required | Secretary access check |
| PATCH | `/api/households/{id}` | Update household | Secretary, Admin | Top-level fields only |
| DELETE | `/api/households/{id}` | Delete household | Secretary, Admin | Cascades to members & subcollections |

### Members

| Method | Path | Purpose | Auth | Notes |
|--------|------|---------|------|-------|
| GET | `/api/households/{hid}/members` | List members | Required | Paginated, searchable |
| POST | `/api/households/{hid}/members` | Create member | Secretary, Admin | Auto-calculates age & senior status |
| PATCH | `/api/households/{hid}/members/{mid}` | Update member | Secretary, Admin | Recalculates household totals |
| DELETE | `/api/households/{hid}/members/{mid}` | Delete member | Secretary, Admin | Recalculates household totals |

---

## Request/Response Templates

### GET /api/households

```bash
curl -X GET "http://localhost:3000/api/households?page=1&limit=10&search=dela&sort=headLastName&order=asc" \
  -H "Cookie: session=..."
```

**Response:** 200 OK
```json
{
  "households": [
    {
      "householdId": "hhld123",
      "headFirstName": "Juan",
      "headLastName": "Dela Cruz",
      "barangay": "Barangay 1",
      "totalResidents": 5,
      "homes": [{"label": "Primary", "latitude": 14.123, "longitude": 121.456}],
      "hasMapLocation": true
    }
  ],
  "totalHouseholds": 1,
  "totalResidents": 5,
  "totalPages": 1,
  "hasNextPage": false,
  "hasPrevPage": false
}
```

---

### POST /api/households

```bash
curl -X POST "http://localhost:3000/api/households" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "headFirstName": "Juan",
    "headLastName": "Dela Cruz",
    "barangay": "Barangay 1",
    "sitio": "Sitio A",
    "contactNumber": "09171234567"
  }'
```

**Response:** 201 Created
```json
{
  "success": true,
  "householdId": "hhld123"
}
```

**Error:** 400 Bad Request
```json
{
  "error": "Missing required field: headFirstName"
}
```

---

### GET /api/households/{householdId}/members

```bash
curl -X GET "http://localhost:3000/api/households/hhld123/members?page=1&limit=20&search=maria" \
  -H "Cookie: session=..."
```

**Response:** 200 OK
```json
{
  "members": [
    {
      "memberId": "mem456",
      "householdId": "hhld123",
      "firstName": "Maria",
      "lastName": "Dela Cruz",
      "age": 8,
      "sex": "Female",
      "relationshipToHead": "Child",
      "isPWD": false,
      "isSeniorCitizen": false
    }
  ],
  "totalMembers": 1,
  "totalPages": 1,
  "hasNextPage": false,
  "hasPrevPage": false
}
```

---

### POST /api/households/{householdId}/members

```bash
curl -X POST "http://localhost:3000/api/households/hhld123/members" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "firstName": "Maria",
    "lastName": "Dela Cruz",
    "age": 8,
    "sex": "Female",
    "relationshipToHead": "Child"
  }'
```

**Response:** 201 Created
```json
{
  "success": true,
  "memberId": "mem456"
}
```

**Side Effect:** Household totals recalculated
```json
(Background recalculation)
households/hhld123:
  - totalResidents: 6 (was 5)
  - totalFemale: 3 (was 2)
  - totalSeniors: 0
  - totalPWDs: 0
```

---

### PATCH /api/households/{householdId}/members/{memberId}

```bash
curl -X PATCH "http://localhost:3000/api/households/hhld123/members/mem456" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "age": 9,
    "isPWD": true
  }'
```

**Response:** 200 OK
```json
{
  "success": true
}
```

**Side Effect:** Household totals recalculated
```json
(Background recalculation)
households/hhld123:
  - totalPWDs: 1 (was 0)
```

---

### DELETE /api/households/{householdId}

```bash
curl -X DELETE "http://localhost:3000/api/households/hhld123" \
  -H "Cookie: session=..."
```

**Response:** 200 OK
```json
{
  "success": true
}
```

**Cascade Effects:**
- ❌ Deletes households/hhld123
- ❌ Deletes all households/hhld123/members/*
- ❌ Deletes all subcollections (geographicIdentification, health, etc.)

---

## Query Parameters

### `/api/households`

| Param | Type | Default | Allowed Values | Example |
|-------|------|---------|----------------|---------|
| page | number | 1 | 1-∞ | `?page=2` |
| limit | number | 10 | 1-100 | `?limit=25` |
| search | string | '' | any text | `?search=dela+cruz` |
| sort | string | headLastName | headLastName, headFirstName, barangay, sitio, createdAt | `?sort=barangay` |
| order | string | asc | asc, desc | `?order=desc` |

### `/api/households/{id}/members`

| Param | Type | Default | Allowed Values | Example |
|-------|------|---------|----------------|---------|
| page | number | 1 | 1-∞ | `?page=1` |
| limit | number | 20 | 1-100 | `?limit=50` |
| search | string | '' | any text | `?search=maria` |

---

## Common Status Codes

| Code | Meaning | Example Responses |
|------|---------|-------------------|
| 200 | OK | GET success, PATCH success, DELETE success |
| 201 | Created | POST success (household, member) |
| 400 | Bad Request | Invalid params, missing required fields |
| 401 | Unauthorized | User not authenticated |
| 403 | Forbidden | Secretary accessing wrong barangay, insufficient role |
| 404 | Not Found | Household/member doesn't exist |
| 500 | Server Error | Database exception, unexpected error |

---

## Authentication

All endpoints require valid session authentication via cookies.

**Required Roles:**
- `GET /api/households` - Brgy-Secretary, MDRRMC-Personnel, MDRRMC-Admin
- `POST /api/households` - Brgy-Secretary (own barangay), MDRRMC-Admin
- `PATCH /api/households` - Brgy-Secretary (own barangay), MDRRMC-Admin
- `DELETE /api/households` - Brgy-Secretary (own barangay), MDRRMC-Admin
- `GET /api/households/{id}/members` - Any authenticated user (with household access)
- `POST /api/households/{id}/members` - Brgy-Secretary (own barangay), MDRRMC-Admin
- `PATCH /api/households/{id}/members/{mid}` - Brgy-Secretary (own barangay), MDRRMC-Admin
- `DELETE /api/households/{id}/members/{mid}` - Brgy-Secretary (own barangay), MDRRMC-Admin

**Secretary Access Rules:**
- Can only access households WHERE `barangay == user.barangay`
- Cannot create households outside their barangay
- Cannot access members of other barangays

---

## Bulk Upload

### File Format (CSV Example)

**Households Sheet:**
```csv
Household ID,Head FirstName,Head LastName,Head Sex,Head Age,Contact Number,Barangay,Sitio,Home1 Latitude,Home1 Longitude
HH001,Juan,Dela Cruz,Male,45,09171234567,Barangay 1,Sitio A,14.1234,121.5678
HH002,Maria,Santos,Female,42,09171234568,Barangay 1,Sitio B,14.1235,121.5679
```

**Members Sheet:**
```csv
Household ID,Member ID,First Name,Last Name,Sex,Age,Relationship To Head,Contact Number,Is PWD
HH001,MEM001,Juan,Dela Cruz,Male,45,Head,,false
HH001,MEM002,Rosa,Dela Cruz,Female,43,Spouse,,false
HH001,MEM003,Maria,Dela Cruz,Female,8,Child,,false
HH002,MEM004,Maria,Santos,Female,42,Head,,false
```

### Upload via UI

- Click "Upload Household Data" button
- Select CSV/Excel/JSON file
- Monitor progress bar (5% → 100%)
- View success message with count

### Progress Stages

1. **Reading** (5%) - File I/O
2. **Parsing** (15%) - Extract sheets
3. **Mapping** (25%) - Build household hierarchy
4. **Building** (35%) - Construct member array
5. **Uploading** (35-95%) - Write to Firestore (batched)
6. **Completed** (100%) - Done, ready to close

---

## Integration with Other Modules

### Dashboard

**Reads:**
- GET /api/households (all top-level fields)
- Sums: totalResidents, totalPWDs, totalSeniors, etc.

**Example:**
```javascript
const { stats } = await fetch('/api/dashboard').then(r => r.json());
console.log(stats.demographics.totalPWDs); // 42
```

### Reports (PWD, Senior)

**Reads:**
- GET /api/households (filter list)
- GET /api/households/{id}/members (with isPWD/isSeniorCitizen filters)

**Example:**
```javascript
const { members } = await fetch(`/api/households/${hhId}/members?search=pwd`).then(r => r.json());
```

### Maps

**Reads:**
- GET /api/households (for homes[] array)
- GET /api/households/{id}/geographicIdentification (for detailed geo data)

**Example:**
```javascript
const { household } = await fetch(`/api/households/${hhId}`).then(r => r.json());
household.homes.forEach(home => {
  // Add marker at home.latitude, home.longitude
});
```

---

## Firestore Write Costs

**Per Household Create:** ~3 writes
- 1 × households doc
- 1 × geographicIdentification doc
- 0-N × members docs (typically 4-5 members per household)

**Per Member Create:** ~2-3 writes
- 1 × members doc
- 1 × demographicCharacteristics doc
- Background: 1 × household doc recalculate

**Bulk Upload (100 households, ~5 members each):**
- Read: 1 file read
- Writes: ~100 households × 3 docs × ~5 members = ~1500 writes
- Batched into ~4 batches (400 docs each) = ~4 batch commits

**Cost Estimate:** ~50 reads, ~1500 writes per 100 household upload

---

## Troubleshooting

### "Forbidden: Cannot access household outside your barangay"
- Secretary trying to access another barangay
- Check user.barangay === household.barangay

### "Missing required field: headFirstName"
- POST payload missing required field
- Check field spelling and JSON syntax

### "Upload failed: Missing sheets"
- Upload file missing "Households" or "Members" sheet
- Rename sheets to exact names (case-insensitive)

### "Upload failed: Households sheet is empty"
- Excel file has empty sheets
- Add data to both sheets before uploading

### "Internal Server Error" on member delete
- Member deletion fails
- Check household still exists
- Check member exists in path

---

## Performance Notes

- Top-level household queries: ~50ms (no nested reads)
- Member list (50 members): ~200ms
- Bulk upload (100 households + 500 members): ~15 seconds

---

Version: 1.0.0
Last Updated: March 30, 2026
