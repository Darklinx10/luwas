"use client";

import AppHeader from "@/components/AppLogoHeader";
import Footer from "@/components/Layout/footer";

export default function AuthLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen  bg-gradient-to-b from-green-50 to-white font-roboto">
      {/* Header */}
      <AppHeader />

      {/* Main: center content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer fixed at bottom */}
      <Footer />
    </div>
  );
}
