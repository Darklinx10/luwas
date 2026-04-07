'use client';

import Link from 'next/link';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import RequiredField from '@/components/Required';
import { useLogin } from '@/features/Authentication/hooks/useLogin';

const fieldShell =
  'flex items-center rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100';

export default function LoginForm({ setShowPageLoader, setRedirectMessage }) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    rememberMe,
    setRememberMe,
    loading,
    handleSubmit,
  } = useLogin({ setShowPageLoader, setRedirectMessage });

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8 md:p-10">
      <div className="mb-8 text-center">
        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
          Secure Login
        </span>
        <h2 className="mt-4 text-2xl font-bold text-slate-800">Welcome Back</h2>
        <p className="mt-2 text-sm text-slate-500">
          Sign in to continue to LUWAS.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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

        <RequiredField
          htmlFor="password"
          label="Password"
          required
          showError={!password.trim() && !loading}
        >
          <div className={`${fieldShell} relative`}>
            <FiLock className="mr-3 text-lg text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent pr-10 text-sm text-slate-700 outline-none"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={toggleShowPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEye /> : <FiEyeOff />}
            </button>
          </div>
        </RequiredField>

        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center text-slate-500">
            <input
              type="checkbox"
              className="mr-2 accent-emerald-600"
              checked={rememberMe}
              onChange={() => setRememberMe((prev) => !prev)}
            />
            Remember me
          </label>

          <Link
            href="/forgotpass"
            className="font-medium text-emerald-600 transition hover:text-emerald-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

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
                d="M12 2a10 10 0 00-10 10h4a6 6 0 016-6V2z"
              />
            </svg>
          ) : (
            'Login'
          )}
        </button>
      </form>
    </div>
  );
}