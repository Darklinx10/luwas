"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from 'next/image';
import { BsFillHousesFill } from "react-icons/bs";
import { HiDocumentReport } from "react-icons/hi";
import { IoMapSharp } from "react-icons/io5";
import { MdSpaceDashboard } from "react-icons/md";

export default function Sidebar({ sidebarOpen }) {
  const pathname = usePathname().toLowerCase(); // Get current path in lowercase

  // Navigation items definition
  const navItems = [
    {
      href: "/dashboard", // Path to dashboard
      label: "Dashboard", // Label displayed
      icon: <MdSpaceDashboard className="text-2xl" />, // Icon component
      isActive: pathname === "/dashboard", // Mark as active if exact path
    },
    {
      href: "/household", // Path to household section
      label: "Households",
      icon: <BsFillHousesFill className="text-2xl" />,
      isActive: pathname.startsWith("/household"), // Active if path starts with /household
    },
    {
      href: "/maps",
      label: "Maps",
      icon: <IoMapSharp className="text-2xl" />,
      isActive: pathname.startsWith("/maps"), // Active if path starts with /maps
    },
    {
      href: "/reports",
      label: "Reports",
      icon: <HiDocumentReport className="text-2xl" />,
      isActive: pathname.startsWith("/reports"), // Active if path starts with /reports
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-full w-64 bg-white shadow-md p-4 z-40 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } sm:w-56 md:w-64`} // Adjust width for small and medium screens
    >
      {/* Logo and System Title */}
      <div className="flex flex-col items-center mb-6 space-y-2">
        <Image
          src="/clarinLogo.png"
          alt="BMIS Logo"
          width={80}
          height={80}
          className="rounded-full"
          priority
        />
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-wide mb-2">LUWAS</h1>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-2">
        {navItems.map(({ href, label, icon, isActive }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-4 px-4 py-2 rounded-md transition-all ${
              isActive
                ? "bg-[#0BAD4A] text-white font-semibold"
                : "text-gray-700 hover:bg-green-100 hover:text-[#0BAD4A]"
            }`}
          >
            {icon}
            <span className="text-base sm:text-sm md:text-base">{label}</span> {/* Adjust text size for responsiveness */}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
