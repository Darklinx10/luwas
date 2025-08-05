'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';
import { GiHamburgerMenu } from 'react-icons/gi';
import { auth, db } from '@/firebase/config';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { registerListener } from '../lib/firebaseAuth';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import ConfirmModal from './modals/confirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/authContext'; // adjust path as needed


export default function Topbar({ toggleSidebar, sidebarOpen }) {
  const [showMenu, setShowMenu] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState(null);
  const menuRef = useRef();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [userRole, setUserRole] = useState('');
  const { setUser, setRole } = useAuth();



  // Fetch current user data from Firestore
  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const fullName = `${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}`.trim();
          setUserName(fullName);
          setUserPhoto(data.photoURL || null);
          setUserRole(data.role || ''); // ✅ Add this
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error.message);
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Monitor authentication state changes and fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData();
      } else {
        setUserName('');
        setUserPhoto(null);
      }
    });

    // Register listener and return cleanup
    registerListener(unsubscribe);
    return () => unsubscribe();
  }, []);

  // Fetch updated user info when the tab regains focus (after editing profile)
  useEffect(() => {
    const handleFocus = () => fetchUserData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Logout handler
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setRole(null);
      localStorage.removeItem("userProfile");
      toast.success("You have been logged out.");

      // Delay 5 seconds (5000ms) before redirecting
      setTimeout(() => {
        router.push("/");
      }, 50);
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to log out.");
    }
  };





  return (
    <div className="flex items-center justify-between px-6 h-15 border-b border-gray-200 bg-white shadow-sm relative">
      {/* Hamburger Button */}
      <button
        onClick={toggleSidebar}
        className="text-2xl text-gray-700 hover:text-black focus:outline-none"
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        <GiHamburgerMenu />
      </button>

      {/* User Info and Dropdown */}
      <div className="relative" ref={menuRef}>
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => setShowMenu((prev) => !prev)}
        >
          {userPhoto ? (
            <img
              src={userPhoto}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border border-gray-300"
            />
          ) : (
            <FaUserCircle className="text-3xl text-gray-700 hover:text-black" />
          )}
        </div>

        {showMenu && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute right-0 mt-2 bg-white rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-1999 w-56 p-4 origin-top-right"
            >
              {/* User Info */}
              <div className="flex flex-col items-center mb-4">
                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt="Profile"
                    className="w-14 h-14 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-3xl">
                    <FaUserCircle />
                  </div>
                )}
                <span className="mt-2 text-sm font-semibold text-gray-800 text-center">
                  {userName || 'Guest User'}
                  {userRole && <p className="text-xs text-gray-500 mt-3">{userRole}</p>}
                </span>
              </div>

              <div className="border-t border-gray-200 my-2 w-full" />

              <a
                href="/dashboard/profile"
                className="block w-full text-center px-4 py-2 text-sm text-gray-700 rounded hover:bg-gray-100 transition"
              >
                Profile
              </a>

              <button
                onClick={() => setShowModal(true)}
                className="block w-full text-center px-4 py-2 text-sm text-gray-700 rounded hover:bg-gray-100 transition"
              >
                Logout
              </button>

              <ConfirmModal
                show={showModal}
                onClose={() => setShowModal(false)}
                message="Are you sure you want to log out?"
                onCancel={() => setShowModal(false)}
                onConfirm={() => {
                  handleLogout();
                  setShowModal(false);
                }}
              />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
