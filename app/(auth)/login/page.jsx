"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/config";
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();

  // State hooks
  const [email, setEmail] = useState(""); // Holds the email input
  const [password, setPassword] = useState(""); // Holds the password input
  const [showPassword, setShowPassword] = useState(false); // Toggles password visibility
  const [loading, setLoading] = useState(false); // Tracks loading state for login button

  // Handles login submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent form default behavior

    // Check if email or password is empty
    if (!email.trim() || !password.trim()) {
      toast.error("Email and password cannot be empty.");
      return;
    }

    setLoading(true); // Start loading spinner
    try {
      // Attempt Firebase Auth login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid; // Get user ID

      // Retrieve user profile from Firestore
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const profile = docSnap.data(); // Extract profile data
        console.log("User profile:", profile); // Debug: log user profile

        // Store profile in localStorage
        localStorage.setItem("userProfile", JSON.stringify(profile));

        toast.success("Logged in successfully");
        router.push("/dashboard"); // Redirect to dashboard
      } else {
        toast.warn("Logged in, but profile not found."); // Edge case: no Firestore document
        router.push("/dashboard");
      }

    } catch (error) {
      console.error("Login error:", error); // Debug: log error
      // Handle specific auth errors
      if (error.code === "auth/invalid-credential") {
        toast.error("Invalid credentials provided.");
      } else if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        toast.error("Incorrect email or password.");
      } else {
        toast.error("Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 font-roboto">
      <div className="w-full max-w-lg flex flex-col items-center space-y-6">

        {/* Logo and titles */}
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
            height={150}
            className="object-contain"
            priority
          />
        </div>

        {/* System title */}
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-wide mb-2">BMIS</h1>
        <h2 className="text-center text-base sm:text-lg md:text-xl font-semibold text-gray-700 leading-snug mt-2">
          Barangay Monitoring Information System
        </h2>

        {/* Login form container */}
        <div className="bg-white border border-gray-300 p-8 rounded-2xl shadow-md w-[342px] h-[400px] mt-4">
          <h2 className="text-xl font-bold text-gray-700 mb-6 text-center">Login</h2>

          {/* Form start */}
          <form onSubmit={handleSubmit}>

            {/* Email field */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm text-gray-700 mb-1">Email</label>
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
            </div>

            {/* Password field with show/hide */}
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm text-gray-700 mb-1">Password</label>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#0BAD4A]/80">
                <FiLock className="text-gray-500 mr-2" />
                <input
                  type={showPassword ? "text" : "password"} // Toggle visibility
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} // Update password state
                  placeholder="••••••••"
                  className="w-full outline-none text-sm"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)} // Toggle state
                  className="ml-2 text-gray-500 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEye /> : <FiEyeOff />}
                </button>
              </div>
            </div>

            {/* Remember me and forgot password */}
            <div className="flex items-center justify-between mb-6 text-sm">
              <label htmlFor="rememberMe" className="text-sm font-normal italic flex items-center text-gray-400/90">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  className="mr-2 accent-blue-600"
                />
                Remember me
              </label>
              <a href="/forgotpass" className="text-[#0BAD4A] hover:underline text-sm">
                Forgot password?
              </a>
            </div>

            {/* Login button */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="w-[200px] bg-[#0BAD4A] hover:bg-[#0a9c43] text-white font-medium py-2 rounded-lg transition flex justify-center items-center"
                disabled={loading} // Disable while loading
              >
                {loading ? (
                  // Spinner icon during loading
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
                  "Login" // Button text
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
