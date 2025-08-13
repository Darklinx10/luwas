"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/config";
import Image from 'next/image';
import RequiredField from "@/components/Required";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPageLoader, setShowPageLoader] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState("Redirecting...");

  // Prefill on component mount
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
        toast.error("User profile not found. Please contact your administrator.");
        setLoading(false);
        return;
      }

      // Save to localStorage
      localStorage.setItem("userProfile", JSON.stringify(profile));
      setShowPageLoader(true);

      // ✅ Remember Me logic
      if (rememberMe) {
        localStorage.setItem("savedEmail", email);
        localStorage.setItem("savedPassword", password);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("savedEmail");
        localStorage.removeItem("savedPassword");
        localStorage.removeItem("rememberMe");
      }

      // Role-based redirect
      setTimeout(() => {
        const role = profile.role;

        if (role === "SeniorAdmin") {
          setRedirectMessage("Redirecting to Maps...");
          router.push("/maps");
        } else {
          setRedirectMessage("Redirecting to Dashboard...");
          router.push("/dashboard");
        }
      }, 1000);

    } catch (error) {
      console.error("Login error:", error);
      switch (error.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          toast.error("Incorrect email or password.");
          break;
        case "auth/too-many-requests":
          toast.error("Too many attempts. Please try again later.");
          break;
        default:
          toast.error("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Full-page loader UI
  if (showPageLoader) {
    return (
      <div className="flex items-center justify-center h-screen">
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
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4 font-roboto">
      <div className="w-full max-w-lg flex flex-col items-center space-y-6">

        {/* Logos */}
        <div className="flex justify-center gap-4 ml-6 mb-6">
          <Image src="/clarinLogo.png" alt="Clarin Municipality Logo" width={90} height={90} className="rounded-full" priority />
          <Image src="/mdrrmcLogo.png" alt="MDRRMC Logo" width={150} height={150} className="object-contain" priority />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-wide mb-2">LUWAS</h1>
        <h2 className="text-center text-base sm:text-lg md:text-xl font-semibold text-gray-700 leading-snug mt-2">
          LGU Unified Web-based Alert System for Risk Mapping and Accident Reporting
        </h2>

        {/* Login form */}
        <div className="bg-white border border-gray-300 p-8 rounded-2xl shadow-md w-[342px] mt-4">
          <h2 className="text-xl font-bold text-gray-700 mb-6 text-center">Login</h2>
          <form onSubmit={handleSubmit}>
            
            {/* Email */}
            <div className="mb-4">
              <RequiredField
                htmlFor="email"
                label="Email"
                required
                showError={!email.trim() && loading === false}
              >
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#0BAD4A]/80">
                  <FiMail className="text-gray-500 mr-2" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full outline-none text-sm"
                    required
                    autoComplete="email"
                  />
                </div>
              </RequiredField>
            </div>

            {/* Password */}
            <div className="mb-4">
              <RequiredField
                htmlFor="password"
                label="Password"
                required
                showError={!password.trim() && loading === false}
              >
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#0BAD4A]/80">
                  <FiLock className="text-gray-500 mr-2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full outline-none text-sm"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="ml-2 text-gray-500 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEye /> : <FiEyeOff />}
                  </button>
                </div>
              </RequiredField>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between mb-6 text-sm">
              <label
                htmlFor="rememberMe"
                className="text-sm font-normal italic flex items-center text-gray-400/90 cursor-pointer"
              >
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  className="mr-2 accent-blue-600"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                Remember me
              </label>

              <a href="/forgotpass" className="text-[#0BAD4A] hover:underline text-sm">
                Forgot password?
              </a>
            </div>

            {/* Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="w-[200px] bg-[#0BAD4A] hover:bg-[#0a9c43] text-white font-medium py-2 rounded-lg transition flex justify-center items-center"
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
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                    />
                  </svg>
                ) : (
                  "Login"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
