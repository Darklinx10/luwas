'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';
import { GiHamburgerMenu } from 'react-icons/gi';
import { FiChevronDown, FiLogOut, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import ConfirmModal from '@/components/LogoutConfirmation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '@/context/authContext';
import Link from 'next/link';

export default function Topbar({ toggleSidebar, sidebarOpen }) {
  const { profile, role, loading, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully.');
      router.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to log out.');
    }
  };

  if (loading) return null;

  const userName = profile
    ? `${profile.firstName || ''} ${profile.middleName || ''} ${profile.lastName || ''}`.replace(/\s+/g, ' ').trim()
    : 'Guest User';

  const userPhoto = profile?.profilePhoto || null;
  const userRole = role || 'System User';

  return (
    <header className="relative flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          type="button"
        >
          <GiHamburgerMenu className="text-lg" />
        </button>

        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-slate-800">LUWAS</p>
          <p className="text-xs text-slate-500">LGU Unified Web-based Alert System</p>
        </div>
      </div>

      {/* Right side */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setShowMenu((prev) => !prev)}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm transition hover:bg-slate-50"
        >
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50">
            {userPhoto ? (
              <Image
                src={userPhoto}
                alt="Profile"
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <FaUserCircle className="h-full w-full text-slate-400" />
            )}
          </div>

          <div className="hidden text-left sm:block">
            <p className="max-w-[160px] truncate text-sm font-semibold text-slate-800">
              {userName}
            </p>
            <p className="text-xs text-slate-500">{userRole}</p>
          </div>

          <FiChevronDown className="hidden text-slate-500 sm:block" />
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 z-[5000] mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            >
              <div className="border-b border-slate-200 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                    {userPhoto ? (
                      <Image
                        src={userPhoto}
                        alt="Profile"
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FaUserCircle className="h-full w-full text-slate-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {userName}
                    </p>
                    <p className="truncate text-xs text-slate-500">{userRole}</p>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <Link
                  href="/profile"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <FiUser size={16} />
                  Profile
                </Link>

                <button
                  onClick={() => setShowModal(true)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  type="button"
                >
                  <FiLogOut size={16} />
                  Logout
                </button>
              </div>

              <ConfirmModal
                show={showModal}
                onClose={() => setShowModal(false)}
                message="Are you sure you want to log out?"
                onCancel={() => setShowModal(false)}
                onConfirm={() => {
                  handleLogout();
                  setShowModal(false);
                  setShowMenu(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}