
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser } from "react-icons/fi";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/config";
import RequiredField from "@/components/Required";

export default function LoginForm({ setShowPageLoader, setRedirectMessage }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    const savedPassword = localStorage.getItem("savedPassword");
    const savedRememberMe = localStorage.getItem("rememberMe") === "true";

    if (savedEmail && savedPassword && savedRememberMe) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Email and password cannot be empty.");
      return;
    }

    setLoading(true);

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const uid = user.uid;
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      let profile;

      if (docSnap.exists()) {
        profile = docSnap.data();
        toast.success("Logged in successfully.");
      } else {
        profile = {
          uid,
          email: user.email,
          displayName: user.displayName || "",
          role: "MDRRMC-Admin",
          createdAt: new Date().toISOString(),
        };
        await setDoc(docRef, profile);
        toast.success("Profile created and logged in successfully.");
      }

      localStorage.setItem("userProfile", JSON.stringify(profile));

      // ✅ Show loader with logos/title centered
      setShowPageLoader(true);

      if (rememberMe) {
        localStorage.setItem("savedEmail", email);
        localStorage.setItem("savedPassword", password);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("savedEmail");
        localStorage.removeItem("savedPassword");
        localStorage.removeItem("rememberMe");
      }

      setTimeout(() => {
        const role = profile.role;
        if (role === "MDRRMC-Admin") {
          setRedirectMessage("Redirecting to Maps...");
          router.replace("/maps");
        } else {
          setRedirectMessage("Redirecting to Dashboard...");
          router.replace("/dashboard");
        }
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        bg-gradient-to-b from-white to-green-50 border border-gray-200
        p-6 sm:p-8 md:p-10
        rounded-2xl shadow-xl
        w-full max-w-sm sm:max-w-md md:max-w-lg
        mx-auto
      "
    >
      {/* Logo & Title inside form */}
      <div className="flex flex-col items-center mb-8">
        <FiUser className="text-green-600 text-6xl mb-3" />
        <h2 className="text-2xl font-extrabold text-green-700">Welcome Back</h2>
        <p className="text-gray-500 text-sm mt-1">Login to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <RequiredField
          htmlFor="email"
          label="Email"
          required
          showError={!email.trim() && loading === false}
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

        {/* Password */}
        <RequiredField
          htmlFor="password"
          label="Password"
          required
          showError={!password.trim() && loading === false}
        >
          <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#0BAD4A]/80 bg-white shadow-sm">
            <FiLock className="text-gray-500 mr-3 text-lg" />
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full outline-none text-sm bg-transparent"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="ml-2 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEye /> : <FiEyeOff />}
            </button>
          </div>
        </RequiredField>

        {/* Options */}
        <div className="flex items-center justify-between text-sm">
          <label
            htmlFor="rememberMe"
            className="flex items-center text-gray-500 cursor-pointer"
          >
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              className="mr-2 accent-green-600"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
            />
            Remember me
          </label>

          <a
            href="/forgotpass"
            className="text-[#0BAD4A] hover:underline font-medium"
          >
            Forgot password?
          </a>
        </div>

        {/* Button */}
        <button
          type="submit"
          className="w-full bg-[#0BAD4A] hover:bg-[#0a9c43] text-white font-semibold py-2.5 sm:py-3 rounded-xl shadow-md transition flex justify-center items-center"
          disabled={loading}
        >


          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
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
            "Login"
          )}
        </button>
      </form>
    </div>
  );
}
