# Dashboard Module

Feature-based dashboard module providing summary statistics, analytics, and visualizations for the LUWAS system.

## Directory Structure

```
features/Dashboard/
├── components/              # Reusable UI components
│   ├── SummaryCard.jsx     # Summary statistics display cards
│   ├── BottomStat.jsx      # Bottom statistics cards (PWD, Seniors, etc.)
│   ├── BarChart.jsx        # Barangay residents bar chart
│   ├── AgeBracketChart.jsx # Age distribution chart
│   └── Spinner.jsx         # Loading spinner
├── hooks/                  # Custom React hooks
│   └── useDashboard.js     # Main dashboard data fetching hook
├── services/               # API and business logic
│   └── dashboardService.js # Dashboard API service
├── utils/                  # Utility functions
├── index.js               # Feature exports
└── README.md              # This file
```

## Features

### Summary Statistics
- **Total Residents**: Aggregated from household members
- **Total Households**: Count of all households with valid data
- **Total Families**: Aggregated families from household records
- **Mapped Households**: Count of households with valid GPS coordinates

### Demographics
- **Male/Female Distribution**: Percentage breakdown by gender
- **PWD Count**: Total persons with disabilities
- **Senior Citizens**: Total residents 60+ years old

### Analytics
- **Residents by Barangay**: Horizontal bar chart showing resident distribution
- **Age Bracket Distribution**: 14-bracket age range distribution chart

### Hazards & Accidents
- **Total Hazards**: Count across all hazard types
- **Total Accidents**: Count of recorded accidents

## API Integration

### Dashboard Service API

Located in `services/dashboardService.js`:

```javascript
dashboardApi.fetchDashboardStats()
```

**Endpoint**: `GET /api/dashboard`

**Response Structure**:
```javascript
{
  summary: {
    totalHouseholds,      // number
    totalResidents,       // number
    totalFamilies,        // number
    mappedHouseholds,     // number
    residentCoveragePercent,
  },
  demographics: {
    totalMale,            // number
    totalFemale,          // number
    totalPWDs,            // number
    totalSeniors,         // number
    malePercent,          // percentage
    femalePercent,        // percentage
  },
  ageBracketData: [       // Array
    { age: '0-1', count: 10 },
    // ... 14 age brackets total
  ],
  hazardsAndAccidents: {
    totalHazards,         // number
    totalAccidents,       // number
  },
  barangayResidents: [    // Array
    { name: 'Talon', residents: 250 },
    // ... sorted by residents descending
  ],
  timestamp,              // ISO string
}
```

## Hooks

### useDashboard

Main hook for dashboard state and data fetching.

```javascript
import { useDashboard } from '@/features/Dashboard';

const { loading, error, stats, barangayResidents, ageBracketData } = useDashboard(profile, authLoading);
```

**Parameters**:
- `profile`: User profile object from auth context
- `authLoading`: Boolean indicating authentication loading state

**Returns**:
- `loading`: Boolean indicating data fetch state
- `error`: Error message if fetch failed
- `stats`: Object containing summary, demographics, and hazard counts
- `barangayResidents`: Array of barangay data for charts
- `ageBracketData`: Array of age bracket data for charts

## Components

### SummaryCard

Displays a summary statistic with icon and loading state.

```jsx
<SummaryCard
  title="Total Residents"
  value={stats.residents}
  icon={<FaUsers />}
  color="bg-blue-500"
  loading={loading}
/>
```

**Props**:
- `title` (string): Display title
- `value` (number): The statistic value
- `icon` (ReactNode): Icon component
- `color` (string): Tailwind color class
- `loading` (boolean): Shows spinner if true

### BottomStat

Similar to SummaryCard, displays bottom statistics section.

```jsx
<BottomStat
  title="Total PWD"
  value={stats.pwd}
  icon={<FaWheelchair />}
  color="bg-blue-500"
  loading={loading}
/>
```

### BarChart

Displays residents grouped by barangay as horizontal bar chart.

```jsx
<BarChart data={barangayResidents} loading={loading} />
```

**Props**:
- `data` (Array): Barangay resident data
- `loading` (boolean): Shows spinner if true

### AgeBracketChart

Displays age bracket distribution as horizontal bar chart.

```jsx
<AgeBracketChart data={ageBracketData} loading={loading} />
```

**Props**:
- `data` (Array): Age bracket data with `{age: string, count: number}`
- `loading` (boolean): Shows spinner if true

## Authentication & Authorization

Dashboard access is restricted to:
- **Brgy-Secretary** (Barangay Secretary) - views only their barangay
- **MDRRMC-Personnel** (MDRRMC Staff) - views all barangays
- **MDRRMC-Admin** (MDRRMC Administrator) - views all barangays

The `RoleGuard` component at the page level enforces this.

## Performance Notes

The Dashboard API is optimized to:
1. Use **top-level household fields** (totalResidents, totalMale, etc.)
2. **Avoid nested reads** of members subcollection for speed (~100x faster)
3. Batch process hazards from 8 hazard type collections
4. Aggregate all statistics in a single query loop

## Secretary Barangay Filtering

Secretary users automatically see only their assigned barangay data:
- Households filtered to: `barangay == user.barangay`
- Barangay residents filtered accordingly
- Age bracket data filtered to their barangay

## Recent Updates

### v1.0 - Initial Feature-Based Structure
- Extracted dashboard logic into feature-based structure
- Created `useDashboard` hook for data management
- Created `dashboardService` for API abstraction
- Reorganized components into feature folder
- Updated page.jsx to use feature exports
- Added proper documentation

## Troubleshooting

### Dashboard shows no data
- Check authentication (user must have one of the allowed roles)
- Verify households exist with valid `totalResidents` field
- Check browser console for API errors

### Age bracket data shows zeros
- Age bracket calculation requires member birthdate field
- Verify members have `birthdate` field populated
- Check API response in `/api/dashboard` for `ageBracketData`

### Secretary sees other barangays
- Verify user has role 'Brgy-Secretary'
- Verify user.barangay is set in auth context
- Check Firestore security rules allow barangay filtering

## Next Steps

- Add date range filtering
- Add export to CSV/PDF functionality
- Add trends/historical comparison
- Add barangay comparison metrics
- Add household characteristics breakdown
