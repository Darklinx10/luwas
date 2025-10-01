"use client";

import { useState } from "react";
import Image from "next/image";
import Footer from "@/components/Layout/footer";
import LoginForm from "@/app/(auth)/components/LoginForm";

export default function LoginPage() {
  const [showPageLoader, setShowPageLoader] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState("Redirecting...");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-white font-roboto overflow-y-auto">
      {/* Scrollable content */}
      <div className="flex-grow flex flex-col items-center justify-start md:justify-center px-4 py-6 overflow-y-auto">
        
        {/* Logos */}
        <div className="flex justify-center gap-2 mb-4">
          <Image src="/clarinLogo.png" alt="Clarin Logo" width={80} height={80} className="drop-shadow-lg" />
          <Image src="/mdrrmcLogo.png" alt="MDRRMC Logo" width={150} height={150} className="drop-shadow-lg" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-extrabold text-green-700 tracking-wide mb-2">LUWAS</h1>
        <h2 className="text-center max-w-xl text-sm font-medium text-gray-600 leading-snug mb-10">
          LGU Unified Web-based Alert System for Risk Mapping and Accident Reporting
        </h2>

        {/* Loader or Form */}
        {showPageLoader ? (
          <div className="flex flex-col items-center gap-2 mt-4">
            <svg
              className="animate-spin h-10 w-10 text-green-600"
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
        ) : (
          <div className="w-full max-w-md">
            <LoginForm
              setShowPageLoader={setShowPageLoader}
              setRedirectMessage={setRedirectMessage}
            />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
