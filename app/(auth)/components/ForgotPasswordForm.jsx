"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FiMail, FiUser } from "react-icons/fi";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase/config";
import RequiredField from "@/components/Required";

export default function ForgotPassForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPageLoader, setShowPageLoader] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState("Redirecting...");

  const handleResetPassword = async (e) => {
    e.preventDefault();
  
    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }
  
    setLoading(true);
  
    try {
      // Call server-side API to check email
      const res = await fetch("/api/checkEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
  
      const data = await res.json();
  
      if (!res.ok || data.exists === false) {
        toast.error("This email is not registered.");
        setLoading(false);
        return;
      }
  
      // Send reset email via client-side Firebase Auth
      await sendPasswordResetEmail(auth, email);
  
      toast.success("A reset link has been sent. Please check your inbox.");
      setShowPageLoader(true);
      setTimeout(() => {
        setRedirectMessage("Redirecting to login...");
        router.push("/login");
      }, 1000);
  
    } catch (error) {
      console.error("Reset error:", error);
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  

  if (showPageLoader) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-10 w-10 text-green-600 mb-3"
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
          <p className="text-gray-600 text-sm">{redirectMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-white to-green-50 border border-gray-200 p-8 sm:p-10 md:p-12 rounded-2xl shadow-xl w-full max-w-md md:max-w-lg lg:max-w-xl">
      {/* Logo & Title */}
      <div className="flex flex-col items-center mb-8">
        <FiUser className="text-green-600 text-6xl md:text-7xl mb-3" />
        <h2 className="text-3xl md:text-3xl font-extrabold text-green-700">
          Forgot Password
        </h2>
        <p className="text-gray-500 text-sm md:text-base mt-1">
          Enter your email to reset your password
        </p>
      </div>

      <form onSubmit={handleResetPassword} className="space-y-6">
        {/* Email Input */}
        <RequiredField
          htmlFor="email"
          label="Email"
          required
          showError={!email.trim() && !loading}
        >
          <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 md:py-4 focus-within:ring-2 focus-within:ring-[#0BAD4A]/80 bg-white shadow-sm">
            <FiMail className="text-gray-500 mr-3 text-lg md:text-xl" />
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full outline-none text-sm md:text-base bg-transparent"
              required
              autoComplete="email"
            />
          </div>
        </RequiredField>

        {/* Link back to login */}
        <p className="text-sm md:text-base text-center text-gray-600 mt-2">
          Remembered your password?{" "}
          <a
            href="/login"
            className="text-[#0BAD4A] font-medium hover:underline"
          >
            Sign in
          </a>
        </p>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-[#0BAD4A] hover:bg-[#0a9c43] text-white font-semibold py-3 md:py-4 rounded-xl shadow-md transition flex justify-center items-center text-sm md:text-base"
          disabled={loading}
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 md:h-6 md:w-6 text-white"
              viewBox="0 0 24 24"
            >
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
            "Send Reset Email"
          )}
        </button>
      </form>
    </div>
  );
}