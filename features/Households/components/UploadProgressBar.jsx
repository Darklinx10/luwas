'use client';

import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

/**
 * Professional upload progress bar component with detailed status
 */
export default function UploadProgressBar({
  percentage = 0,
  stageName = '',
  message = '',
  currentBatch = 0,
  totalBatches = 0,
  isError = false,
}) {
  const getProgressColor = () => {
    if (isError) return 'bg-red-500';
    if (percentage === 100) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getProgressBackgroundColor = () => {
    if (isError) return 'bg-red-100';
    if (percentage === 100) return 'bg-green-100';
    return 'bg-blue-100';
  };

  return (
    <div className="space-y-3">
      {/* Header with percentage and stage */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {percentage === 100 && !isError && (
            <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          )}
          {isError && (
            <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <div>
            <p className="text-sm font-semibold text-gray-700">{stageName}</p>
            <p className="text-xs text-gray-600">{message}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-gray-800">{percentage}%</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className={`relative h-3 w-full rounded-full overflow-hidden ${getProgressBackgroundColor()}`}>
        <div
          className={`h-full ${getProgressColor()} transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Batch info (shown during uploading stage) */}
      {totalBatches > 0 && currentBatch > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Batch Progress</span>
          <span className="font-medium">
            {currentBatch} of {totalBatches}
          </span>
        </div>
      )}

      {/* Status indicators */}
      <div className="flex gap-2 flex-wrap">
        {!isError && percentage > 0 && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-xs text-blue-700">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
            In Progress
          </div>
        )}
        {percentage === 100 && !isError && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 rounded text-xs text-green-700">
            <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
            Complete
          </div>
        )}
        {isError && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 rounded text-xs text-red-700">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
            Error
          </div>
        )}
      </div>
    </div>
  );
}
