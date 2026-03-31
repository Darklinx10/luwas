import { capitalizeWords } from '@/utils/capitalize';

/**
 * Generate CSV content for PWD report
 * @param {Array} pwdMembers - Array of PWD member objects
 * @returns {string} CSV content
 */
export function generatePWDCSV(pwdMembers) {
  const headers = 'No,Name,Sex,Age,Barangay,Sitio,Contact,Disability';
  const rows = pwdMembers.map((p, idx) =>
    [
      idx + 1,
      p.name || '',
      p.sex || '',
      p.age || '',
      capitalizeWords(p.barangay || ''),
      capitalizeWords(p.sitio || ''),
      p.contact || '',
      p.disability || p.disabilityType || '',
    ]
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  return [headers, ...rows].join('\n');
}

/**
 * Generate CSV content for Senior Citizens report
 * @param {Array} seniors - Array of senior citizen objects
 * @returns {string} CSV content
 */
export function generateSeniorsCSV(seniors) {
  const headers = 'No,Name,Sex,Age,Barangay,Sitio,Contact,Birthdate';
  const rows = seniors.map((s, idx) =>
    [
      idx + 1,
      s.name || '',
      s.sex || '',
      s.age || '',
      capitalizeWords(s.barangay || ''),
      capitalizeWords(s.sitio || ''),
      s.contact || s.contactNumber || '',
      s.birthdate || '',
    ]
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  return [headers, ...rows].join('\n');
}

/**
 * Generate CSV content for Accident report
 * @param {Array} accidents - Array of accident objects
 * @returns {string} CSV content
 */
export function generateAccidentCSV(accidents) {
  const headers = 'No,Date,Location,Type,Description,Casualties';
  const rows = accidents.map((a, idx) =>
    [
      idx + 1,
      a.date || a.dateOfAccident || '',
      a.location || '',
      a.type || a.accidentType || '',
      a.description || '',
      a.casualties || '0',
    ]
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  return [headers, ...rows].join('\n');
}

/**
 * Generate CSV content for Hazard report
 * @param {Array} hazards - Array of hazard objects
 * @param {string} title - Report title (for context)
 * @returns {string} CSV content
 */
export function generateHazardCSV(hazards, title = 'Hazard') {
  const headers = 'No,Location,Name,Barangay,Sitio,Type';
  const rows = hazards.map((h, idx) =>
    [
      idx + 1,
      h.homeLabel || h.location?.label || '',
      h.name || '',
      capitalizeWords(h.barangay || ''),
      capitalizeWords(h.sitio || ''),
      title,
    ]
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  return [headers, ...rows].join('\n');
}

/**
 * Trigger browser download for CSV data
 * @param {string} csvContent - CSV content string
 * @param {string} filename - Filename for download
 */
export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
