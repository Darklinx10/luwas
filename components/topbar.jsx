'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';
import { GiHamburgerMenu } from 'react-icons/gi';
import { auth, db } from '@/firebase/config';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function Topbar({ toggleSidebar, sidebarOpen }) {
  const [showMenu, setShowMenu] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState(null);
  const menuRef = useRef();
  const router = useRouter();

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

  // Fetch logged-in user's name
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const fullName = `${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}`.trim();
            setUserName(fullName);
            setUserPhoto(data.photoURL || null);
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Logout
  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (confirmed) {
      try {
        await signOut(auth);
        toast.success('You have been logged out.');
        router.push('/');
      } catch (error) {
        console.error('Logout failed:', error);
        toast.error('Failed to log out.');
      }
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
  <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-xl z-50 w-56 p-4">
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
      </span>
    </div>

    {/* Divider */}
    <div className="border-t border-gray-200 my-2 w-full" />

    {/* Menu Items */}
    <a
      href="/dashboard/profile"
      className="block w-full text-center px-4 py-2 text-sm text-gray-700 rounded hover:bg-gray-100 transition"
    >
      Profile
    </a>
    <button
      onClick={handleLogout}
      className="w-full text-center px-4 py-2 text-sm text-gray-700 rounded hover:bg-gray-100 transition"
    >
      Logout
    </button>
  </div>
)}

      </div>
    </div>
  );
}
