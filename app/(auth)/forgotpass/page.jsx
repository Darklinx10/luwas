import ForgotPassForm from "@/app/(auth)/components/ForgotPasswordForm";
import Image from "next/image";
import Footer from "@/components/Layout/footer";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-b from-green-50 to-white px-4 font-roboto relative">
      {/* Top Section */}
      <div className="flex flex-col items-center justify-center flex-grow">
        {/* Logos */}
        <div className="flex justify-center gap-3 mb-6">
          <Image
            src="/clarinLogo.png"
            alt="Clarin Municipality Logo"
            width={90}
            height={90}
            className="rounded-full shadow-md"
            priority
          />
          <Image
            src="/mdrrmcLogo.png"
            alt="MDRRMC Logo"
            width={160}
            height={90}
            className="drop-shadow-lg"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-extrabold text-green-700 tracking-wide mb-2">
          LUWAS
        </h1>
        <h2 className="text-center max-w-xl text-base sm:text-lg md:text-xl font-medium text-gray-600 leading-snug mb-10">
          LGU Unified Web-based Alert System for Risk Mapping and Accident Reporting
        </h2>

        {/* Forgot Password Form Card */}
        <div className="w-full max-w-md">
          <ForgotPassForm />
        </div>
      </div>
        <Footer/>
    </div>
  );
}
