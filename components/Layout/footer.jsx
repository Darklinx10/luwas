"use client";

export default function Footer() {
  return (
    <footer className="absolute bottom-6 min-w-screen flex justify-center">
      <p className="text-xs text-gray-400 text-center">
        © {new Date().getFullYear()} Municipality of Clarin · MDRRMC
      </p>
    </footer>
  );
}
