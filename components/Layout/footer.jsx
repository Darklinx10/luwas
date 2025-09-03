"use client";

export default function Footer() {
  return (
    <footer className="absolute bottom-4 min-w-screen flex justify-center">
      <p className="text-xs text-gray-400 text-center leading-relaxed">
        © {new Date().getFullYear()} <br />
        Bohol Island State University Clarin Campus <br />
        MDRRMC of the Municipality of Clarin
        
      </p>
    </footer>
  );
}
