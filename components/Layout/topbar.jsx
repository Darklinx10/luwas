'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';
import { GiHamburgerMenu } from 'react-icons/gi';
import { auth, db } from '@/firebase/config';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { registerListener } from '@/lib/firebaseAuth';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import ConfirmModal from '@/components/LogoutConfirmation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';


export default function Topbar({ toggleSidebar, sidebarOpen }) {
  const [showMenu, setShowMenu] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState(null);
  const menuRef = useRef();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Fetch user info
  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (!user) return;
  
    try {
      const userDocRef = doc(db, 'users', user.uid);
  
      
      const [userDocSnap] = await Promise.all([
        getDoc(userDocRef),
        
      ]);
  
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        const fullName = `${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}`.trim();
        setUserName(fullName);
        setUserPhoto(data.profilePhoto || null);
        setUserRole(data.role || '');
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error.message);
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

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData();
      } else {
        setUserName('');
        setUserPhoto(null);
      }
    });
    registerListener(unsubscribe);
    return () => unsubscribe();
  }, []);

  // Refresh on focus
  useEffect(() => {
    const handleFocus = () => fetchUserData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("You have been logged out.");
      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };
  
  

  return (
    <div className="flex items-center justify-between px-6 h-16 border-b border-gray-200 bg-gradient-to-b from-green-50 to-white shadow-sm relative">
      {/* Hamburger */}
      <button
        onClick={toggleSidebar}
        className="text-2xl text-gray-700 hover:text-green-700 transition"
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        <GiHamburgerMenu />
      </button>

      {/* User Dropdown */}
      <div className="relative" ref={menuRef}>
        <div
          onClick={() => setShowMenu(prev => !prev)}
          className="w-10 h-10 rounded-full overflow-hidden cursor-pointer border border-gray-200 shadow-sm"
        >
          {userPhoto ? (
            <Image
              src={userPhoto} 
              alt="Profile"
              width={40}
              height={40}
              className="object-cover w-full h-full" />
          ) : (
            <FaUserCircle className="w-full h-full text-gray-400" />
          )}
        </div>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 bg-white rounded-2xl border-gray- shadow-xl z-[5000] w-56 p-4"
            >
              {/* User Info */}
              <div className="flex flex-col items-center mb-3">
                {userPhoto ? (
                  <Image
                    src={userPhoto} 
                    alt="Profile" 
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full border border-gray-200" />
                ) : (
                  <FaUserCircle className="text-6xl text-gray-400" />
                )}
                <span className="mt-2 text-sm font-semibold text-gray-800 text-center">{userName || 'Guest User'}</span>
                {userRole && <p className="text-xs text-gray-500 mt-1">{userRole}</p>}
              </div>

              <div className="border-t border-gray-200 my-2" />

              <a
                href="/profile"
                className="block text-center px-4 py-2 text-sm text-gray-700 rounded-lg hover:bg-green-50 transition"
              >
                Profile
              </a>

              <button
                onClick={() => setShowModal(true)}
                className="block w-full text-center px-4 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition"
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
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
