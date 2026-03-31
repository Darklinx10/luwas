'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { sendResetEmail } from '../services/authService';
import { getForgotPasswordErrorMessage } from '../utils/authErrors';

export function useForgotPassword() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPageLoader, setShowPageLoader] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState('Redirecting...');

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!email.trim()) {
      toast.error('Please enter your email.');
      return;
    }

    setLoading(true);

    try {
      await sendResetEmail(email);

      // 🔐 Always show same message
      toast.success(
        'If this email is registered, a reset link has been sent.'
      );

      setShowPageLoader(true);

      setTimeout(() => {
        setRedirectMessage('Redirecting to login...');
        router.push('/login');
      }, 1000);
    } catch (error) {
      console.error('Reset error:', error);

      toast.error(getForgotPasswordErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    loading,
    showPageLoader,
    redirectMessage,
    handleResetPassword,
  };
}