'use client';

import Link from 'next/link';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser } from 'react-icons/fi';
import RequiredField from '@/components/Required';
import { useLogin } from '@/features/Authentication/hooks/useLogin';

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
    <div className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-white border border-gray-200 rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 flex flex-col overflow-hidden">
      <div className="flex flex-col items-center mb-6 sm:mb-8">
        <FiUser className="text-green-600 text-6xl mb-2 sm:mb-3" />
        <h2 className="text-2xl font-extrabold text-green-700 text-center">
          Welcome Back
        </h2>
        <p className="text-gray-500 text-sm mt-1 text-center">
          Login to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <RequiredField
          htmlFor="email"
          label="Email"
          required
          showError={!email.trim() && !loading}
        >
          <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#0BAD4A]/80 bg-white shadow-sm">
            <FiMail className="text-gray-500 mr-3 text-lg" />
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full outline-none text-sm bg-transparent"
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
          <div className="relative flex items-center border border-gray-300 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#0BAD4A]/80 bg-white shadow-sm">
            <FiLock className="text-gray-500 mr-3 text-lg" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full outline-none text-sm bg-transparent pr-10"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={toggleShowPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ?<FiEye /> : <FiEyeOff />  }
            </button>
          </div>
        </RequiredField>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              id="checkbox"
              className="mr-2 accent-green-600"
              checked={rememberMe}
              onChange={() => setRememberMe((prev) => !prev)}
            />
            Remember me
          </label>

          <Link href="/forgotpass" className="text-[#0BAD4A] hover:underline font-medium">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="w-full bg-[#0BAD4A] hover:bg-[#0a9c43] text-white font-semibold py-2.5 sm:py-3 rounded-xl shadow-md transition flex justify-center items-center disabled:opacity-70"
          disabled={loading}
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
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