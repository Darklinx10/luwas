/**
 * features/Reports/index.js
 *
 * Reports feature module exports
 * Feature-based architecture - Integrated with household module
 */

// Hooks
export { usePWDReport } from './hooks/usePWDReport';
export { useSeniorsReport } from './hooks/useSeniorsReport';
export { useAffectedHouseholdsReport } from './hooks/useAffectedHouseholdsReport';

// Services
export {
  reportApi,
  fetchPWDReport,
  fetchSeniorsReport,
  fetchAffectedHouseholdsReport,
  fetchAccidentsReport,
  fetchAccidentById,
  updateAccidentReport,
  deleteAccidentReport,
} from './services/reportService';

// Components - PWD
export { default as PWDReportView } from './components/PWD/PWDReportView';

// Components - Seniors
export { default as SeniorsReportView } from './components/Seniors/SeniorsReportView';

// Components - Accidents
export { default as AccidentsReportView } from './components/Accidents/AccidentsReportView';

// Components - Affected Households
export { default as AffectedHouseholdsReportView } from './components/AffectedHouseholds/AffectedHouseholdsReportView';

// Components - Shared
export { default as ReportTable } from './components/Shared/ReportTable';
export { default as ReportSearch } from './components/Shared/ReportSearch';
export { default as ReportPagination } from './components/Shared/ReportPagination';
