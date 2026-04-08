'use client';

/**
 * Browser-safe household bulk upload service.
 * Parsing, validation, and Firestore writes now happen in the protected API route.
 */

const SUPPORTED_EXTENSIONS = ['json', 'xlsx', 'xls'];

const handleResponse = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || fallbackMessage);
  }

  return data;
};

/**
 * Upload households and members through the protected server API.
 * Keeps the existing file + progress callback signature used by the hook.
 *
 * @param {File} file
 * @param {(progress: {
 *   percentage: number,
 *   stage: string,
 *   message: string,
 *   currentBatch?: number,
 *   totalBatches?: number
 * }) => void} [onProgress]
 * @returns {Promise<number>}
 */
export async function uploadHouseholdsFromFile(file, onProgress) {
  if (!file) {
    throw new Error('Please select a file to upload');
  }

  const ext = file.name.split('.').pop().toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error('Unsupported file type');
  }

  onProgress?.({
    percentage: 5,
    stage: 'reading',
    message: 'Preparing upload...',
    currentBatch: 0,
    totalBatches: 0,
  });

  const formData = new FormData();
  formData.append('file', file);

  onProgress?.({
    percentage: 20,
    stage: 'parsing',
    message: 'Sending file to secure upload API...',
    currentBatch: 0,
    totalBatches: 0,
  });

  const response = await fetch('/api/households/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const data = await handleResponse(
    response,
    'Failed to upload household data'
  );

  onProgress?.({
    percentage: 90,
    stage: 'uploading',
    message: data.batchCount
      ? `Uploaded in ${data.batchCount} batch${data.batchCount !== 1 ? 'es' : ''}. Finalizing...`
      : 'Finalizing upload...',
    currentBatch: data.batchCount || 0,
    totalBatches: data.batchCount || 0,
  });

  return Number(data.count || 0);
}
