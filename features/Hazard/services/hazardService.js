'use client';

/**
 * Browser-safe hazard service
 * Reads and mutations go through protected Next.js API routes
 */

const handleResponse = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || fallbackMessage);
  }

  return data;
};

/**
 * Fetch all hazard summaries for the admin hazard table
 * @returns {Promise<Array>}
 */
export const fetchHazards = async () => {
  const response = await fetch('/api/hazards', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  const data = await handleResponse(response, 'Failed to fetch hazards');
  return data.hazards || [];
};

/**
 * Delete a hazard through the protected API
 * @param {Object} hazard
 * @returns {Promise<void>}
 */
export const deleteHazard = async (hazard) => {
  if (!hazard?.type || !hazard?.id) {
    throw new Error('Hazard type and id are required');
  }

  const params = new URLSearchParams({
    type: hazard.type,
    id: hazard.id,
  });

  const response = await fetch(`/api/hazards?${params.toString()}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  await handleResponse(response, 'Failed to delete hazard');
};

/**
 * Preview hazard: fetch GeoJSON + legend/color from protected API
 * @param {Object} hazard
 * @returns {Promise<Object>}
 */
export const previewHazard = async (hazard) => {
  if (!hazard?.type || !hazard?.id) {
    throw new Error('Hazard type and id are required');
  }

  const params = new URLSearchParams({
    type: hazard.type,
    id: hazard.id,
  });

  const response = await fetch(`/api/hazards?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  const data = await handleResponse(response, 'Failed to preview hazard');

  return {
    ...hazard,
    ...(data.hazard || {}),
  };
};

/**
 * Upload and save a new hazard via protected API
 * @param {Object} params
 * @param {File} params.geojsonFile
 * @param {string} params.hazardType
 * @param {string} params.description
 * @param {Object} [params.legendProp]
 * @param {Object} [params.colorSettings]
 * @returns {Promise<Object>}
 */
export const uploadHazard = async ({
  geojsonFile,
  hazardType,
  description,
  legendProp,
  colorSettings,
}) => {
  if (!hazardType || !description || !geojsonFile) {
    throw new Error('Missing required fields');
  }

  if (geojsonFile.size > 10 * 1024 * 1024) {
    throw new Error('File size exceeds 10MB limit');
  }

  const content = await geojsonFile.text();
  let geojsonData;

  try {
    geojsonData = JSON.parse(content);
  } catch {
    throw new Error('Invalid GeoJSON format');
  }

  if (
    !geojsonData.type ||
    (geojsonData.type !== 'FeatureCollection' && geojsonData.type !== 'Feature')
  ) {
    throw new Error('GeoJSON must be a Feature or FeatureCollection');
  }

  if (
    geojsonData.type === 'FeatureCollection' &&
    !Array.isArray(geojsonData.features)
  ) {
    throw new Error('FeatureCollection must have a features array');
  }

  const formData = new FormData();
  formData.append('file', geojsonFile);
  formData.append('hazardType', hazardType);
  formData.append('description', description);

  if (legendProp) {
    formData.append('legendProp', JSON.stringify(legendProp));
  }

  if (colorSettings) {
    formData.append('colorSettings', JSON.stringify(colorSettings));
  }

  const response = await fetch('/api/hazards', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  return handleResponse(response, 'Failed to upload hazard');
};
