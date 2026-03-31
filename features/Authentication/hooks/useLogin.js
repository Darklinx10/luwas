'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/authContext';
import {
  loginWithEmail,
  getOrCreateUserProfile,
  createServerSession,
  logoutClient,
} from '../services/authService';
import { getLoginErrorMessage } from '../utils/authErrors';
import { getPostLoginRedirect } from '../utils/authRedirect';
import {
  getRememberedEmail,
  saveRememberMe,
} from '../utils/authStorage';

export function useLogin({ setShowPageLoader, setRedirectMessage } = {}) {
  const router = useRouter();
  const authContext = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const remembered = getRememberedEmail();
    if (remembered?.savedEmail && remembered?.rememberMe) {
      setEmail(remembered.savedEmail);
      setRememberMe(true);
    }
  }, []);

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!email.trim() || !password.trim()) {
      toast.error('Email and password cannot be empty.');
      return;
    }

    setLoading(true);

    try {
      const user = await loginWithEmail(email.trim(), password);

      const idToken = await user.getIdToken(true);
      await createServerSession(idToken);

      // 🔐 Pass idToken to server-side profile creation
      const { profile, isNewUser } = await getOrCreateUserProfile(idToken);

      authContext?.setProfile?.(profile);
      saveRememberMe(email.trim(), rememberMe);

      const redirect = getPostLoginRedirect({
        isNewUser,
        role: profile?.role,
      });

      setShowPageLoader?.(true);
      setRedirectMessage?.(redirect.message);

      toast.success(
        isNewUser
          ? 'Profile created successfully. Please complete your profile.'
          : 'Logged in successfully.'
      );

      router.replace(redirect.path);
    } catch (error) {
      console.error('Login error:', error);

      try {
        await logoutClient();
      } catch (logoutError) {
        console.error('Cleanup logout failed:', logoutError);
      }

      toast.error(getLoginErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    rememberMe,
    setRememberMe,
    loading,
    handleSubmit,
  };
}