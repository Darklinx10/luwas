"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser } from "react-icons/fi";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import RequiredField from "@/components/Required";
import { useAuth } from "@/context/authContext";

export default function LoginForm({ setShowPageLoader, setRedirectMessage }) {
  const router = useRouter();
  const authContext = useAuth(); // ✅ Get auth context
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load remembered credentials
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
      // 1️⃣ Sign in with Firebase Auth
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const uid = user.uid;

      // 2️⃣ Fetch Firestore profile
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      let profile;
      let isNewUser = false;

      if (docSnap.exists()) {
        profile = docSnap.data();
        toast.success("Logged in successfully.");
      } else {
        // Create profile if it doesn't exist
        profile = {
          uid,
          email: user.email,
          displayName: user.displayName || "",
          role: "MDRRMC-Admin", // default role
          createdAt: new Date().toISOString(),
        };
        await setDoc(docRef, profile);
        toast.success("Profile created successfully. Please complete your profile.");

        isNewUser = true; // mark that this is a new user

        // ⚡ Update auth context immediately
        if (authContext && authContext.setProfile) {
          authContext.setProfile(profile);
        }
      }

      // 3️⃣ Create session cookie via API
      const idToken = await user.getIdToken(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, role: profile.role }),
      });

      const resBody = await res.json();
      if (!res.ok) throw new Error(resBody.error || "Failed to create session");

      // 4️⃣ Save profile in localStorage
      localStorage.setItem("userProfile", JSON.stringify(profile));

      // 5️⃣ Remember credentials if checked
      if (rememberMe) {
        localStorage.setItem("savedEmail", email);
        localStorage.setItem("savedPassword", password);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("savedEmail");
        localStorage.removeItem("savedPassword");
        localStorage.removeItem("rememberMe");
      }

      setShowPageLoader && setShowPageLoader(true);

      // 6️⃣ Redirect after login
      setTimeout(() => {
        if (isNewUser) {
          setRedirectMessage && setRedirectMessage("Redirecting to complete your profile...");
          router.replace("/profile/edit-profile"); // redirect new user to edit profile
        } else if (profile.role === "MDRRMC-Admin") {
          setRedirectMessage && setRedirectMessage("Redirecting to Households...");
          router.replace("/household");
        } else {
          setRedirectMessage && setRedirectMessage("Redirecting to Dashboard...");
          router.replace("/dashboard");
        }
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);

      let message = "Login failed. Please try again.";

      if (error.code) {
        switch (error.code) {
          case "auth/user-not-found":
          case "auth/wrong-password":
          case "auth/invalid-credential":
            message = "Invalid credentials! Incorrect email or password.";
            break;
          case "auth/invalid-email":
            message = "Invalid email format.";
            break;
          case "auth/user-disabled":
            message = "This account has been disabled.";
            break;
          case "auth/too-many-requests":
            message = "Too many login attempts. Please try again later.";
            break;
        }
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-white border border-gray-200 rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="flex flex-col items-center mb-6 sm:mb-8">
        <FiUser className="text-green-600 text-6xl mb-2 sm:mb-3" />
        <h2 className="text-2xl font-extrabold text-green-700 text-center">Welcome Back</h2>
        <p className="text-gray-500 text-sm mt-1 text-center">Login to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <RequiredField htmlFor="email" label="Email" required showError={!email.trim() && !loading}>
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

        <RequiredField htmlFor="password" label="Password" required showError={!password.trim() && !loading}>
          <div className="relative flex items-center border border-gray-300 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#0BAD4A]/80 bg-white shadow-sm">
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
              className="absolute right-3 top-1/2 -translate-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <FiEye /> : <FiEyeOff />}
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
              onChange={() => setRememberMe(!rememberMe)}
            />
            Remember me
          </label>

          <a href="/forgotpass" className="text-[#0BAD4A] hover:underline font-medium">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          className="w-full bg-[#0BAD4A] hover:bg-[#0a9c43] text-white font-semibold py-2.5 sm:py-3 rounded-xl shadow-md transition flex justify-center items-center"
          disabled={loading}
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
          ) : (
            "Login"
          )}
        </button>
      </form>
    </div>
  );
}