"use client";

import { FaUserCircle } from "react-icons/fa";
import { GiHamburgerMenu } from "react-icons/gi";

export default function Topbar({ toggleSidebar, sidebarOpen }) {
  return (
    <div className="flex items-center justify-between px-6 h-20 border-b border-gray-200 bg-white shadow-sm">
      {/* Hamburger Button */}
      <button
        onClick={toggleSidebar}
        className="text-2xl text-gray-700 hover:text-black focus:outline-none"
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <GiHamburgerMenu />
      </button>

      {/* User Icon */}
      <div className="flex items-center gap-2 text-gray-700">
        <FaUserCircle className="text-3xl" />
      </div>
    </div>
  );
}
