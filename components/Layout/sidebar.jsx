"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { BsFillHousesFill } from "react-icons/bs";
import { HiDocumentReport } from "react-icons/hi";
import { IoMapSharp } from "react-icons/io5";
import { FaExclamationTriangle, FaUserShield } from "react-icons/fa";
import { MdSpaceDashboard } from "react-icons/md";
import { useAuth } from "@/context/authContext";

export default function Sidebar({ sidebarOpen }) {
  const pathname = usePathname().toLowerCase();
  const profile = useAuth();

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <MdSpaceDashboard className="text-2xl sm:text-1xl md:text-1xl" />,
      allowedRoles: ["Brgy-Secretary", "MDRRMC-Personnel"]
    },
    {
      href: "/household",
      label: "Households",
      icon: <BsFillHousesFill className="text-2xl sm:text-1xl md:text-1xl" />,
      allowedRoles: ["Brgy-Secretary", "MDRRMC-Personnel"]
    },
    {
      href: "/maps",
      label: "Maps",
      icon: <IoMapSharp className="text-2xl sm:text-1xl md:text-1xl" />,
      allowedRoles: ["MDRRMC-Admin", "MDRRMC-Personnel"]
    },
    { 
      href: "/hazards",
      label: "Hazards",
      icon: <FaExclamationTriangle className="text-2xl sm:text-1xl md:text-1xl" />,
      allowedRoles: ["MDRRMC-Admin"]
    },
    { 
      href: "/users",
      label: "User Management",
      icon: <FaUserShield className="text-2xl sm:text-1xl md:text-1xl" />,
      allowedRoles: ["MDRRMC-Admin"]
    },
    { 
      href: "/reports",
      label: "Reports",
      icon: <HiDocumentReport className="text-2xl sm:text-1xl md:text-1xl" />,
      allowedRoles: ["MDRRMC-Personnel"]
    },
  ];
  
  return (
    <aside
      className={`
        fixed top-0 left-0 h-full bg-gradient-to-b from-green-50 to-white shadow-lg border-r border-gray-200 p-4
        transform transition-transform duration-300 ease-in-out z-50
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        w-16 sm:w-20 md:w-64
      `}
    >
      {/* Logo */}
      <div className="flex flex-col items-center mb-6 md:mb-8">
        <Image
          src="/clarinLogo.png"
          alt="LUWAS Logo"
          width={40}
          height={40}
          className="rounded-full sm:w-16 md:h-16 "
          priority
        />
        {/* Title & subtitle only on md+ */}
        <h1 className="text-xl font-extrabold text-green-700 tracking-wide mt-2 hidden md:block text-center">
          LUWAS
        </h1>
        <p className="text-xs text-gray-500 text-center hidden md:block">
          LGU Unified Web-based Alert System
        </p>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {navItems
          .filter(item => item.allowedRoles.map(r => r.toLowerCase()).includes(profile.role?.toLowerCase()))
          .map(({ href, label, icon }) => {
            const isActive = pathname.startsWith(href.toLowerCase());
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-3 px-4 py-2 rounded-xl font-large transition-all
                  ${isActive
                    ? "bg-green-600 text-white font-bold shadow-md"
                    : "text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-white hover:text-green-700"
                  }
                `}
              >
                {/* Icon always visible */}
                <span className="text-xl">{icon}</span>
                {/* Label only on md+ */}
                <span className="text-md  hidden md:inline">{label}</span>
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}
