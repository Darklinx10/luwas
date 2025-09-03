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
      icon: <MdSpaceDashboard />,
      allowedRoles: ["Brgy-Secretary", "MDRRMC-Personnel"],
    },
    {
      href: "/household",
      label: "Households",
      icon: <BsFillHousesFill />,
      allowedRoles: ["Brgy-Secretary", "MDRRMC-Personnel"],
    },
    {
      href: "/maps",
      label: "Maps",
      icon: <IoMapSharp />,
      allowedRoles: ["MDRRMC-Admin", "MDRRMC-Personnel"],
    },
    {
      href: "/hazards",
      label: "Hazards",
      icon: <FaExclamationTriangle />,
      allowedRoles: ["MDRRMC-Admin"],
    },
    {
      href: "/users",
      label: "User Management",
      icon: <FaUserShield />,
      allowedRoles: ["MDRRMC-Admin"],
    },
    {
      href: "/reports",
      label: "Reports",
      icon: <HiDocumentReport />,
      allowedRoles: ["MDRRMC-Personnel", "Brgy-Secretary"],
    },
  ];

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full z-50 flex flex-col
        transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? "w-64" : "w-20"}
        bg-gradient-to-b from-green-50 to-white
    border-r border-gray-200 shadow-xl
      `}
    >
      {/* Logo & Title */}
      <div className="flex flex-col items-center mb-8 mt-4 transition-all duration-300">
        <Image
          src="/clarinLogo.png"
          alt="LUWAS Logo"
          width={80}
          height={80}
          className="rounded-full shadow-md"
          priority
        />
        <h1
          className={`text-xl font-extrabold text-green-700 tracking-wide mt-2 text-center 
            transition-all duration-300 overflow-hidden 
            ${sidebarOpen ? "opacity-100 max-h-10" : "opacity-0 max-h-0"}
          `}
        >
          LUWAS
        </h1>
        <p
          className={`text-sm text-gray-500 text-center transition-all duration-300 overflow-hidden
            ${sidebarOpen ? "opacity-100 max-h-10" : "opacity-0 max-h-0"}
          `}
        >
          LGU Unified Web-based Alert System
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 px-2">
        {navItems
          .filter((item) =>
            item.allowedRoles
              .map((r) => r.toLowerCase())
              .includes(profile.role?.toLowerCase())
          )
          .map(({ href, label, icon }) => {
            const isActive = pathname.startsWith(href.toLowerCase());
            return (
              <Link
                key={href}
                href={href}
                className={`
                  group relative flex items-center rounded-xl text-lg font-medium
                  px-3 py-3 transition-all duration-300
                  ${
                    isActive
                      ? "bg-green-50 border-l-4 border-green-600 text-green-700 shadow-md"
                      : "text-gray-600 hover:bg-green-50 hover:text-green-700"
                  }
                `}
              >
                {/* Icon with circle bg */}
                <span
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-lg
                    transition-all duration-300
                    ${
                      isActive
                        ? "bg-green-600 text-white scale-110"
                        : "bg-gray-200 group-hover:bg-green-200"
                    }
                  `}
                >
                  {icon}
                </span>

                {/* Label */}
                <span
                  className={`
                    ml-3 whitespace-nowrap transition-all duration-300
                    ${sidebarOpen ? "opacity-100 max-w-xs" : "opacity-0 max-w-0"}
                    ${isActive ? "font-bold text-green-700" : "group-hover:font-semibold"}
                    overflow-hidden
                  `}
                >
                  {label}
                </span>

                {/* Tooltip when collapsed */}
                {!sidebarOpen && (
                  <span
                    className="absolute left-full ml-3 px-2 py-1 rounded-md bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap"
                  >
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
      </nav>

      {/* Footer user info */}
      <div
        className={`
          mt-auto mb-6 flex flex-col items-center text-sm text-gray-500 transition-all duration-300 overflow-hidden
          ${sidebarOpen ? "opacity-100 max-h-32" : "opacity-0 max-h-0"}
        `}
      >
        {/* User Avatar */}
        <div className={`
          w-12 h-12 rounded-full overflow-hidden flex items-center justify-center mb-2
          border border-gray-200 shadow-sm transition-transform duration-300 hover:scale-105 cursor-pointer
        `}>
          {profile?.profilePhoto ? (
            <img 
              src={profile.profilePhoto} 
              alt="Profile" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <span className="bg-green-100 w-full h-full flex items-center justify-center text-green-600 font-bold text-lg">
              {profile?.name?.charAt(0) || "G"}
            </span>
          )}
        </div>

        {/* User Name */}
        <p className="font-medium text-center">{profile?.name || "User"}</p>

        {/* User Role */}
        {profile?.role && <p className="text-gray-400 text-xs text-center">{profile.role}</p>}
      </div>


    </aside>
  );
}
