"use client";

import { useState } from "react";
import Image from "next/image";
import Footer from "@/components/Layout/footer";
import LoginForm from "@/app/(auth)/components/LoginForm";

export default function LoginPage() {
  const [showPageLoader, setShowPageLoader] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState("Redirecting...");

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-b from-green-50 to-white px-4 font-roboto relative">
      <div className="flex flex-col items-center justify-center flex-grow">
        {/* Logos */}
        <div className="flex justify-center gap-3 mb-6">
          <Image
            src="/clarinLogo.png"
            alt="Clarin Municipality Logo"
            width={90}
            height={90}
            className="rounded-full shadow-md sm:w-20 sm:h-20 md:w-24 md:h-24"
          />
          <Image
            src="/mdrrmcLogo.png"
            alt="MDRRMC Logo"
            width={180}
            height={90}
            className="drop-shadow-lg"
          />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-extrabold text-green-700 tracking-wide mb-2">LUWAS</h1>
        <h2 className="text-center max-w-xl text-base sm:text-lg md:text-xl font-medium text-gray-600 leading-snug mb-10">
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
