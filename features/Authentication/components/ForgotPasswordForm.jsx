'use client';

import Link from 'next/link';
import { FiMail } from 'react-icons/fi';
import RequiredField from '@/components/Required';
import { useForgotPassword } from '@/features/Authentication/hooks/useForgotPassword';

const fieldShell =
  'flex items-center rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100';

export default function ForgotPassForm() {
  const {
    email,
    setEmail,
    loading,
    showPageLoader,
    redirectMessage,
    handleResetPassword,
  } = useForgotPassword();

  if (showPageLoader) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <svg
            className="mb-3 h-10 w-10 animate-spin text-emerald-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <p className="text-sm text-slate-500">{redirectMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8 md:p-10">
      <div className="mb-8 text-center">
        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
          Password Recovery
        </span>
        <h2 className="mt-4 text-2xl font-bold text-slate-800">Forgot Password</h2>
        <p className="mt-2 text-sm text-slate-500">
          Enter your email address and we’ll help you reset your password.
        </p>
      </div>

      <form onSubmit={handleResetPassword} className="space-y-6">
        <RequiredField
          htmlFor="email"
          label="Email"
          required
          showError={!email.trim() && !loading}
        >
          <div className={fieldShell}>
            <FiMail className="mr-3 text-lg text-slate-400" />
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
              required
              autoComplete="email"
            />
          </div>
        </RequiredField>

        <p className="text-center text-sm text-slate-500">
          Remembered your password?{' '}
          <Link href="/login" className="font-medium text-emerald-600 hover:underline">
            Sign in
          </Link>
        </p>

        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-70"
          disabled={loading}
        >
          {loading ? (
            <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
              />
            </svg>
          ) : (
            'Send Reset Email'
          )}
        </button>
      </form>
    </div>
  );
}