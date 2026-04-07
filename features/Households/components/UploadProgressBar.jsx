'use client';

import { FiAlertCircle, FiCheckCircle, FiLoader } from 'react-icons/fi';

export default function UploadProgressBar({
  percentage = 0,
  stageName = '',
  message = '',
  currentBatch = 0,
  totalBatches = 0,
  isError = false,
}) {
  const isComplete = percentage === 100 && !isError;
  const isInProgress = percentage > 0 && !isComplete && !isError;

  const progressColor = isError
    ? 'bg-red-500'
    : isComplete
      ? 'bg-emerald-500'
      : 'bg-emerald-600';

  const progressTrack = isError
    ? 'bg-red-100'
    : isComplete
      ? 'bg-emerald-100'
      : 'bg-slate-200';

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {isComplete && <FiCheckCircle className="h-5 w-5 text-emerald-600" />}
            {isError && <FiAlertCircle className="h-5 w-5 text-red-600" />}
            {isInProgress && <FiLoader className="h-5 w-5 animate-spin text-emerald-600" />}
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">{stageName || 'Uploading'}</p>
            <p className="mt-1 text-sm text-slate-500">{message}</p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg font-bold text-slate-800">{percentage}%</p>
        </div>
      </div>

      <div className={`h-3 w-full overflow-hidden rounded-full ${progressTrack}`}>
        <div
          className={`h-full ${progressColor} transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {totalBatches > 0 && currentBatch > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Batch progress</span>
          <span className="font-medium text-slate-700">
            {currentBatch} of {totalBatches}
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {isInProgress && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
            In Progress
          </span>
        )}

        {isComplete && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Complete
          </span>
        )}

        {isError && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-red-100">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
            Error
          </span>
        )}
      </div>
    </div>
  );
}