"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BsFillHousesFill } from "react-icons/bs";
import { HiDocumentReport } from "react-icons/hi";
import { IoMapSharp } from "react-icons/io5";
import { MdSpaceDashboard } from "react-icons/md";

import BmisLogo from "./bmisLogo";

export default function Sidebar({ sidebarOpen }) {
  const pathname = usePathname().toLowerCase();

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <MdSpaceDashboard className="text-2xl" />,
      isActive: pathname === "/dashboard",
    },
    {
      href: "/household",
      label: "Households",
      icon: <BsFillHousesFill className="text-2xl" />,
      isActive: pathname.startsWith("/household"),
    },
    {
      href: "/maps",
      label: "Maps",
      icon: <IoMapSharp className="text-2xl" />,
      isActive: pathname.startsWith("/maps"),
    },
    {
      href: "/reports",
      label: "Reports",
      icon: <HiDocumentReport className="text-2xl" />,
      isActive: pathname.startsWith("/reports"),
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-full w-64 bg-white shadow-md p-4 z-40 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Logo + Title */}
      <div className="flex flex-col items-center mb-6 space-y-2">
        <BmisLogo/>
        <div className="text-xl font-bold text-[#0BAD4A]">BMIS</div>
      </div>

      {/* Navigation */}
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
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
