"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FiMail } from "react-icons/fi";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase/config";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // State for email input
  const [email, setEmail] = useState(""); // Holds the user's email
  const [loading, setLoading] = useState(false); // Tracks loading state

  // Handles password reset form submission
  const handleResetPassword = async (e) => {
    e.preventDefault(); // Prevent default form behavior

    // Check for empty email input
    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    setLoading(true); // Start loading spinner
    try {
      // Firebase function to send reset email
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent. Please check your inbox.");
      router.push("/login"); // Redirect back to login page
    } catch (error) {
      console.error("Reset error:", error); // Debug: log any error

      // Handle specific Firebase errors
      if (error.code === "auth/user-not-found") {
        toast.error("Email not found.");
      } else {
        toast.error("Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 font-roboto">
      <div className="w-full max-w-lg flex flex-col items-center space-y-6">

        {/* Logos */}
        <div className="flex justify-center gap-4 ml-6 mb-6">
          <Image
            src="/clarinLogo.png"
            alt="Clarin Municipality Logo"
            width={90}
            height={90}
            className="rounded-full"
            priority
          />
          <Image
            src="/mdrrmcLogo.png"
            alt="MDRRMC Logo"
            width={150}
            height={170}
            className="object-contain"
            priority
          />
        </div>

        {/* System title */}
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-wide mb-2">BMIS</h1>
        <h2 className="text-center text-base sm:text-lg md:text-xl font-semibold text-gray-700 leading-snug mt-2">
          Barangay Monitoring Information System
        </h2>

        {/* Forgot Password form container */}
        <div className="bg-white border border-gray-300 p-8 rounded-2xl shadow-md w-[342px] h-[340px] mt-4">
          <h2 className="text-xl font-bold text-gray-700 mb-6 text-center">
            Forgot Password
          </h2>

          {/* Form starts here */}
          <form onSubmit={handleResetPassword}>
            <div className="mb-6">
              {/* Email input label and field */}
              <label htmlFor="email" className="block text-sm text-gray-700 mb-1">
                Enter your email to reset password
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#0BAD4A]/80">
                <FiMail className="text-gray-500 mr-2" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} // Update email state
                  placeholder="you@example.com"
                  className="w-full outline-none text-sm"
                  required
                  autoComplete="email"
                />
              </div>

              {/* Link back to login */}
              <p className="text-sm text-center text-gray-600 mt-4">
                Remembered your password?{" "}
                <a href="/login" className="text-[#0BAD4A] font-medium hover:underline">
                  Sign in
                </a>
              </p>
            </div>

            {/* Submit button */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="w-[200px] bg-[#0BAD4A] hover:bg-[#0a9c43] text-white font-medium py-2 rounded-lg transition flex justify-center items-center"
                disabled={loading} // Disable button during loading
              >
                {loading ? (
                  // Show loading spinner if loading
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
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                    />
                  </svg>
                ) : (
                  "Send Reset Email" 
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
