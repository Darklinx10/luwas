# Reports Feature

Comprehensive reporting module for generating, filtering, and exporting reports on PWD members, Senior Citizens, Accidents, and Hazard-affected Households.

## Overview

The Reports feature provides a unified interface for viewing and managing various types of reports in the LUWAS system. It supports four main report types:

1. **PWD Report** - List of Persons with Disability
2. **Seniors Report** - List of Senior Citizens (age ≥ 60)
3. **Accidents Report** - List of Reported Accidents
4. **Hazards Report** - Households affected by specific hazard types

## Directory Structure

```
features/Reports/
├── components/
│   ├── PWDTable.jsx          # PWD members table with edit/delete
│   ├── SeniorTable.jsx        # Senior citizens table with edit/delete
│   ├── AccidentTable.jsx      # Accident reports with image/map
│   └── HazardTable.jsx        # Affected households for each hazard type
├── hooks/
│   ├── usePWDReport.js        # PWD data fetching and management
│   ├── useSeniorsReport.js    # Senior citizen data management
│   ├── useAccidentsReport.js  # Accident data management
│   └── useHazardsReport.js    # Hazard-affected households
├── services/
│   └── reportApi.js           # Centralized API calls for all reports
├── utils/
│   ├── nameFormatter.js       # Name formatting utilities
│   └── csvExport.js           # CSV generation and download
├── index.js                   # Central exports
├── README.md                  # This file
├── API_REFERENCE.md           # API endpoint documentation
└── FINALIZATION_SUMMARY.md    # Implementation summary
```

## Components

### PWDTable
Displays a paginated table of PWD members with search, filtering, edit, and CSV export.

**Features:**
- Search by name
- Pagination support
- Edit disability type
- Print functionality
- CSV export

**Props:**
- `title: string` - Report title

```jsx
import { PWDTable } from '@/features/Reports';

<PWDTable title="List of Persons with Disability" />
```

### SeniorTable
Displays Senior Citizens (age ≥ 60) with search and management features.

**Features:**
- Search by name
- Pagination support
- Edit member information
- Print functionality
- CSV export

**Props:**
- `title: string` - Report title

```jsx
import { SeniorTable } from '@/features/Reports';

<SeniorTable title="List of Senior Citizens" />
```

### AccidentTable
Displays accident reports with images, location mapping, and editing.

**Features:**
- Search across all fields
- View location on map
- Edit accident details
- Image display and upload
- Delete records
- CSV export

**Props:**
- `title: string` - Report title

```jsx
import { AccidentTable } from '@/features/Reports';

<AccidentTable title="Accident Reports" />
```

### HazardTable
Displays households affected by specific hazard types.

**Features:**
- Search by household name, barangay, contact, or value
- Display affected households
- Legend property detection (numeric/categorical)
- Print functionality
- CSV export

**Props:**
- `data: Array` - Array of affected households
- `title: string` - Report title
- `loading: boolean` - Loading state
- `legendProp: Object` - Legend property with key and type
- `formatValue: Function` - Custom value formatter

```jsx
import { HazardTable } from '@/features/Reports';

<HazardTable
  data={affectedHouseholds}
  title="Reported Hazards: Flood"
  loading={loading}
  legendProp={{ key: 'susceptibility', type: 'numeric' }}
/>
```

## Hooks

### usePWDReport()
Manages PWD member data fetching, searching, and pagination.

**Returns:**
```javascript
{
  pwdMembers: Array,           // Current page of PWD members
  searchTerm: string,          // Search query
  setSearchTerm: Function,     // Update search
  loading: boolean,            // Loading state
  authLoading: boolean,        // Auth check loading
  pagination: {
    page: number,              // Current page
    limit: number,             // Items per page
    totalCount: number,        // Total PWD members
    totalPages: number,        // Total pages
  },
  goToPage: Function,          // Navigate to page
  savePWD: Function,           // Save PWD record
  deletePWD: Function,         // Delete PWD record
  refetch: Function,           // Refetch data
}
```

### useSeniorsReport()
Manages Senior Citizens data fetching and management.

**Returns:**
```javascript
{
  seniors: Array,              // Current page of seniors
  searchTerm: string,          // Search query
  setSearchTerm: Function,     // Update search
  loading: boolean,            // Loading state
  authLoading: boolean,        // Auth check loading
  pagination: {
    page: number,
    limit: number,
    totalCount: number,
    totalPages: number,
  },
  goToPage: Function,
  saveSenior: Function,
  deleteSenior: Function,
  refetch: Function,
}
```

### useAccidentsReport()
Manages accident report data fetching and filtering.

**Returns:**
```javascript
{
  accidents: Array,            // Filtered accidents
  allAccidents: Array,         // All accidents
  searchTerm: string,
  setSearchTerm: Function,
  loading: boolean,
  refetch: Function,
  setAccidents: Function,
}
```

### useHazardsReport(selectedHazardType)
Fetches hazard data and affected households by intersection with geographic zones.

**Parameters:**
- `selectedHazardType: string` - Hazard type (e.g., 'flood', 'landslide')

**Returns:**
```javascript
{
  affectedHouseholds: Array,   // Households affected by hazard
  loading: boolean,
  legendProp: Object,          // Legend property for value display
  hazardGeoJSON: Object,       // Raw hazard GeoJSON
  refetch: Function,
}
```

## Utilities

### nameFormatter.js
Formatting utilities for member names in reports.

**Functions:**
- `formatNameLastFirst(fullName)` - Format as "LastName, FirstName"
- `formatNameFromParts(member)` - Format from firstName/lastName fields
- `getMemberDisplayName(member)` - Auto-detect and format display name

### csvExport.js
CSV generation and export utilities.

**Functions:**
- `generatePWDCSV(pwdMembers)` - Generate PWD CSV
- `generateSeniorsCSV(seniors)` - Generate Seniors CSV
- `generateAccidentCSV(accidents)` - Generate Accidents CSV
- `generateHazardCSV(hazards, title)` - Generate Hazards CSV
- `downloadCSV(csvContent, filename)` - Trigger browser download

## Usage Example

```jsx
'use client';

import { PWDTable, SeniorTable, AccidentTable, HazardTable } from '@/features/Reports';
import { useState } from 'react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('pwd');

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setReportType('pwd')}
          className={reportType === 'pwd' ? 'bg-green-600 text-white' : 'bg-gray-300'}
        >
          PWD
        </button>
        <button
          onClick={() => setReportType('senior')}
          className={reportType === 'senior' ? 'bg-green-600 text-white' : 'bg-gray-300'}
        >
          Seniors
        </button>
        <button
          onClick={() => setReportType('accident')}
          className={reportType === 'accident' ? 'bg-green-600 text-white' : 'bg-gray-300'}
        >
          Accidents
        </button>
      </div>

      {reportType === 'pwd' && <PWDTable title="PWD Members" />}
      {reportType === 'senior' && <SeniorTable title="Senior Citizens" />}
      {reportType === 'accident' && <AccidentTable title="Accidents" />}
    </div>
  );
}
```

## API Integration

The Reports feature uses existing API endpoints:

- `GET /api/reports/pwd` - Fetch PWD report
- `GET /api/reports/seniors` - Fetch Seniors report
- `GET /api/accidents` - Fetch accident records
- `GET /api/hazards/:type` - Fetch hazard data

See [API_REFERENCE.md](API_REFERENCE.md) for detailed endpoint documentation.

## Features

✅ **Pagination** - Efficient data loading with cursor-based pagination
✅ **Search & Filter** - Real-time filtering of report data
✅ **Print** - Browser print functionality for all reports
✅ **CSV Export** - Download reports as CSV files
✅ **Inline Editing** - Edit PWD/Senior records directly
✅ **Image Upload** - Add/update images for accidents
✅ **Map Integration** - View accident locations on map
✅ **Hazard Analysis** - GIS-based household-hazard intersection
✅ **Role-based Access** - Secretary sees only their barangay data
✅ **Mobile Responsive** - Works on all screen sizes

## Performance Considerations

- **Pagination**: Reports use server-side pagination to handle large datasets
- **Search Debouncing**: 300ms debounce on search to reduce API calls
- **Lazy Loading**: Hazard data loads only when selected
- **Batch Processing**: Household processing uses 100-item batches
- **CSV Export**: Client-side generation for instant downloads

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile 90+)

## Related Features

- [Dashboard](../Dashboard) - Main dashboard views
- [Households](../Households) - Household management
- [Map](../Map) - Geographic visualization
