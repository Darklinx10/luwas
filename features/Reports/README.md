# Reports Feature Module

## Overview

The Reports feature module is a **feature-based architecture** integrated into the household module. It provides PWD (Persons with Disability) and Seniors (Senior Citizens) reports with a clean, modular structure.

This module follows the same pattern as Dashboard and Map features for consistency across the LUWAS system.

## Architecture

```
features/Reports/
├── components/
│   ├── PWD/
│   │   └── PWDReportView.jsx          # PWD report display component
│   ├── Seniors/
│   │   └── SeniorsReportView.jsx      # Seniors report display component
│   └── Shared/
│       ├── ReportTable.jsx             # Reusable table component
│       ├── ReportSearch.jsx            # Search/filter component
│       └── ReportPagination.jsx        # Pagination controls
├── hooks/
│   ├── usePWDReport.js                 # PWD report data hook
│   └── useSeniorsReport.js             # Seniors report data hook
├── services/
│   └── reportService.js                # API integration layer
├── utils/
│   └── (utility functions)
├── index.js                            # Barrel exports
└── README.md                           # This file
```

## Core Features

### 1. **PWD Report**
- Lists all Persons with Disability
- Paginated display
- Search/filter functionality
- Household context included
- Integrated with memberService for data fetching

### 2. **Seniors Report**
- Lists all Senior Citizens (age >= 60)
- Paginated display
- Search/filter functionality
- Birthdate tracking
- Integrated with memberService for data fetching

### 3. **Shared Components**
- **ReportTable**: Flexible table component with custom columns
- **ReportSearch**: Debounced search input
- **ReportPagination**: Navigation controls

## Data Flow

```
Component (PWDReportView / SeniorsReportView)
  ↓
Hook (usePWDReport / useSeniorsReport)
  ↓
Service (reportService.js)
  ↓
API Endpoint (/api/reports/pwd or /api/reports/seniors)
  ↓
memberService (getAllPWDMembers / getAllSeniorMembers)
  ↓
Firestore (collectionGroup query)
```

## Usage

### Basic Usage

```jsx
import { PWDReportView, SeniorsReportView } from '@/features/Reports';

export default function ReportsPage() {
  return (
    <div className="space-y-12">
      <PWDReportView />
      <SeniorsReportView />
    </div>
  );
}
```

### Using Hooks Directly

```jsx
import { usePWDReport } from '@/features/Reports';

export default function CustomPWDReport() {
  const {
    members,
    loading,
    error,
    page,
    setPage,
    setSearch,
    totalPages,
    hasNextPage,
    hasPrevPage,
  } = usePWDReport();

  return (
    // Your custom UI here
  );
}
```

### Using API Directly

```jsx
import { reportApi } from '@/features/Reports';

async function fetchReport() {
  const data = await reportApi.fetchPWDReport({
    page: 1,
    limit: 10,
    search: 'John',
  });
  
  console.log(data.members, data.totalMembers);
}
```

## Integration with Household Module

This feature is **fully integrated** with the household module:

1. **memberService**: Provides `getAllPWDMembers()` and `getAllSeniorMembers()` functions
2. **householdService**: Provides household context data
3. **Barangay Filtering**: Automatically filtered for Secretaries
4. **Error Handling**: Intelligent Firestore error handling with auto-generated index links

## API Endpoints

### PWD Report
```
GET /api/reports/pwd
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 10, max: 100)
  - search: string (optional)

Response:
{
  success: boolean,
  members: Array<Member>,
  totalMembers: number,
  totalPages: number,
  currentPage: number,
  hasNextPage: boolean,
  hasPrevPage: boolean
}
```

### Seniors Report
```
GET /api/reports/seniors
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 10, max: 100)
  - search: string (optional)

Response:
{
  success: boolean,
  members: Array<Member>,
  totalMembers: number,
  totalPages: number,
  currentPage: number,
  hasNextPage: boolean,
  hasPrevPage: boolean
}
```

## Member Data Structure

```typescript
interface ReportMember {
  memberId: string;
  householdId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  age: number | null;
  birthdate: string; // ISO date
  sex: string;
  contactNumber: string;
  headFirstName: string;
  headLastName: string;
  headFullName: string;
  householdBarangay: string;
  householdSitio: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

The reports module includes intelligent error handling:

1. **Firestore Index Errors**: Automatically extracts and displays index creation links
2. **Network Errors**: Graceful error messages
3. **Authentication**: Returns 401 if not authenticated
4. **Index Errors**: Returns 503 with actionable steps

## Customization

### Custom Table Columns

```jsx
const customColumns = [
  { key: 'firstName', label: 'Name' },
  { 
    key: 'age', 
    label: 'Age',
    render: (member) => `${member.age} years old`
  },
];

<ReportTable members={members} columns={customColumns} />
```

### Custom Styling

All components use Tailwind CSS and can be customized by:
1. Modifying the component JSX
2. Using Tailwind's `@apply` directive
3. Adding custom CSS classes

## Performance Considerations

1. **Pagination**: Offset-based pagination (load-more pattern)
2. **Search**: Client-side filtering of results
3. **Caching**: No caching implemented (fresh data on each fetch)
4. **Optimizations**: 
   - Lazy loading of components
   - Debounced search (500ms)
   - Efficient re-renders with hooks

## Future Enhancements

- [ ] Export to CSV/Excel
- [ ] Advanced filtering (age range, barangay)
- [ ] Cursor-based pagination for large datasets
- [ ] Report caching/aggregation
- [ ] Batch operations (update, delete)
- [ ] Custom report templates

## Related Modules

- **Dashboard**: `features/Dashboard/` - Summary statistics
- **Map**: `features/Map/` - Geographic visualization
- **Household**: `lib/api/householdService.js` - Core household data
- **Members**: `lib/api/memberService.js` - Member data service

## Testing

```bash
# Test PWD report
npm test -- usePWDReport

# Test Seniors report
npm test -- useSeniorsReport

# Test components
npm test -- ReportTable

# Test API endpoints
npm test -- /api/reports/
```

## Troubleshooting

### Index Error
- **Issue**: "Firestore composite index required"
- **Solution**: Check server logs for index creation link, click it to create the index

### No Members Found
- **Issue**: Empty results
- **Solution**: Verify members exist with required fields (isPWD or isSeniorCitizen)

### Slow Performance
- **Issue**: Report takes long time to load
- **Solution**: Check pagination, consider cursor-based pagination for large datasets

## License

Part of LUWAS (Livelihood and User Welfare Administrative System)
