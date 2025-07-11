"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";
import { GiHamburgerMenu } from "react-icons/gi";
import { auth } from "@/firebase/config";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";

export default function Topbar({ toggleSidebar, sidebarOpen }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef();
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      try {
        await signOut(auth);
        toast.success("You have been logged out.");
        router.push("/");
      } catch (error) {
        console.error("Logout failed:", error);
        toast.error("Failed to log out.");
      }
    }
  };

  return (
    <div className="flex items-center justify-between px-6 h-15 border-b border-gray-200 bg-white shadow-sm relative">
      {/* Hamburger Button */}
      <button
        onClick={toggleSidebar}
        className="text-2xl text-gray-700 hover:text-black focus:outline-none"
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <GiHamburgerMenu />
      </button>

      {/* User Icon with Dropdown */}
      <div className="relative" ref={menuRef}>
        <button onClick={() => setShowMenu(!showMenu)} className="focus:outline-none">
          <FaUserCircle className="text-3xl text-gray-700 hover:text-black" />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 bg-white border rounded shadow-lg z-50 w-40">
            <a
              href="/dashboard/profile"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Profile
            </a>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
