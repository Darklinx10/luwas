'use client';

import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { uploadHouseholdsFromFile } from '../services/householdUploadService';

const STAGE_NAMES = {
  reading: 'Reading file',
  parsing: 'Parsing data',
  mapping: 'Mapping households',
  building: 'Building members',
  uploading: 'Uploading batches',
  completed: 'Completed',
};

const INITIAL_STATE = {
  percentage: 0,
  stage: '',
  message: '',
  currentBatch: 0,
  totalBatches: 0,
  isUploading: false,
  isComplete: false,
  error: null,
};

/**
 * Hook for managing household upload state and operations
 * Handles file validation, progress tracking, and error management
 */
export function useHouseholdUpload() {
  const [uploadState, setUploadState] = useState(INITIAL_STATE);

  const resetProgress = useCallback(() => {
    setUploadState(INITIAL_STATE);
  }, []);

  const handleUpload = useCallback(async (file, onSuccess) => {
    // Validate file
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    const validExtensions = ['json', 'xlsx', 'xls'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(ext)) {
      toast.error(`Invalid file type. Supported: ${validExtensions.join(', ')}`);
      return;
    }

    // Reset state and start upload
    setUploadState({
      ...INITIAL_STATE,
      isUploading: true,
    });

    try {
      const count = await uploadHouseholdsFromFile(file, (progress) => {
        setUploadState({
          percentage: progress.percentage,
          stage: progress.stage,
          message: progress.message,
          currentBatch: progress.currentBatch || 0,
          totalBatches: progress.totalBatches || 0,
          isUploading: true,
          isComplete: false,
          error: null,
        });
      });

      // Final success state
      setUploadState({
        percentage: 100,
        stage: 'completed',
        message: `Successfully uploaded ${count} household${count !== 1 ? 's' : ''} and their members`,
        currentBatch: 0,
        totalBatches: 0,
        isUploading: false,
        isComplete: true,
        error: null,
      });

      toast.success(
        `Successfully uploaded ${count} household${count !== 1 ? 's' : ''} and their members`
      );

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(count);
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to upload household data';

      setUploadState({
        percentage: 0,
        stage: 'error',
        message: errorMessage,
        currentBatch: 0,
        totalBatches: 0,
        isUploading: false,
        isComplete: false,
        error: errorMessage,
      });

      console.error('Upload error:', error);
      toast.error(errorMessage);
    }
  }, []);

  return {
    // State
    percentage: uploadState.percentage,
    stage: uploadState.stage,
    stageName: STAGE_NAMES[uploadState.stage] || uploadState.stage,
    message: uploadState.message,
    currentBatch: uploadState.currentBatch,
    totalBatches: uploadState.totalBatches,
    isUploading: uploadState.isUploading,
    isComplete: uploadState.isComplete,
    error: uploadState.error,

    // Methods
    handleUpload,
    resetProgress,

    // Full state (for advanced usage)
    state: uploadState,
  };
}
