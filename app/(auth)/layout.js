"use client";

import AppHeader from "@/components/AppLogoHeader";
import Footer from "@/components/Layout/footer";

export default function AuthLayout({ children }) {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-green-50 to-white font-roboto overflow-hidden">
      {/* Header */}
      <AppHeader />

      {/* Main: center content */}
      <main className="flex-1 flex items-center justify-center px-2">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer fixed at bottom */}
      <Footer />
    </div>
  );
}
