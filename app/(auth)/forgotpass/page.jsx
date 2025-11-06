"use client";

import ForgotPassForm from "@/app/(auth)/components/ForgotPasswordForm";
import Footer from "@/components/Layout/footer";
import AppHeader from "../../../components/AppLogoHeader";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-green-50 to-white px-4 font-roboto overflow-y-auto">
      {/* Top Section */}
      <div className="flex-grow flex flex-col items-center justify-start md:justify-center px-4 py-6 overflow-y-auto">
        <AppHeader />
        {/* Forgot Password Form Card */}
        <div className="w-full max-w-md">
          <ForgotPassForm />
        </div>
      </div>
        <Footer/>
    </div>
  );
}
