'use client';

import Image from 'next/image';

export default function AppHeader() {
  return (
    <header className="w-full flex flex-col items-center justify-center text-center py-6">
      {/* Logos and Title */}
      <div className="grid grid-cols-3 items-center w-full max-w-xl mb-2 px-4">
        {/* Left Logo */}
        <div className="flex justify-end">
          <Image
            src="/clarinLogo.png"
            alt="Clarin Logo"
            width={80}
            height={70}
            className="drop-shadow-lg "
          />
        </div>

        {/* Center Title */}
        <div className="flex justify-center">
          <h1 className="text-3xl sm:text-4xl max-w-xl font-extrabold text-green-700 tracking-wide">
            LUWAS
          </h1>
        </div>

        {/* Right Logo */}
        <div className="flex justify-start">
          <Image
            src="/mdrrmcLogo.png"
            alt="MDRRMC Logo"
            width={130}
            height={110}
            className="drop-shadow-lg h-auto"
          />
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-center max-w-xl text-gray-600 text-base sm:text-lg md:text-xl font-medium leading-relaxed mt-2">
        LGU Unified Web-based Alert System for Risk Mapping and Accident Reporting
      </p>
    </header>
  );
}
