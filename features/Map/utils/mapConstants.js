/**
 * features/Map/utils/mapConstants.js
 *
 * Constants used throughout the Map module
 */

export const MAP_TYPES = {
  HOUSEHOLD_MAP: 'Household Map',
  ACCIDENT_MAP: 'Accident Map',
};

export const MARKER_LABELS = {
  PRIMARY_HOME: 'Primary Home',
  SECONDARY_HOME: 'Secondary Home',
  TERTIARY_HOME: 'Tertiary Home',
};

export const ROLES = {
  MDRRMC_ADMIN: 'MDRRMC-Admin',
  MDRRMC_PERSONNEL: 'MDRRMC-Personnel',
  BRGY_SECRETARY: 'Brgy-Secretary',
};

export const ALLOWED_MAP_ROLES = [
  ROLES.MDRRMC_ADMIN,
  ROLES.MDRRMC_PERSONNEL,
];

export const DEFAULT_MAP_CENTER = [12.8797, 121.774];
export const DEFAULT_MAP_ZOOM = 12.5;

export const ACCIDENT_HEAT_MAX = 5;
export const ACCIDENT_CLUSTERING_RADIUS = 50;

// Batch processing for household markers
export const HOUSEHOLD_BATCH_SIZE = 250;
