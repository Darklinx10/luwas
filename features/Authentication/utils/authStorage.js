const SAVED_EMAIL_KEY = 'savedEmail';
const REMEMBER_ME_KEY = 'rememberMe';

export function getRememberedEmail() {
  if (typeof window === 'undefined') {
    return { savedEmail: '', rememberMe: false };
  }

  return {
    savedEmail: localStorage.getItem(SAVED_EMAIL_KEY) || '',
    rememberMe: localStorage.getItem(REMEMBER_ME_KEY) === 'true',
  };
}

export function saveRememberMe(email, rememberMe) {
  if (typeof window === 'undefined') return;

  if (rememberMe) {
    localStorage.setItem(SAVED_EMAIL_KEY, email);
    localStorage.setItem(REMEMBER_ME_KEY, 'true');
  } else {
    localStorage.removeItem(SAVED_EMAIL_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
  }
}

// 🔐 Removed saveUserProfile() - profile should be server-authoritative only!
// Never cache auth-sensitive data in localStorage to prevent stale state issues.