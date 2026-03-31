export function getLoginErrorMessage(error) {
  if (!error) return 'Login failed. Please try again.';

  if (error.code) {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid credentials! Incorrect email or password.';
      case 'auth/invalid-email':
        return 'Invalid email format.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many login attempts. Please try again later.';
      default:
        return 'Login failed. Please try again.';
    }
  }

  return error.message || 'Login failed. Please try again.';
}

export function getForgotPasswordErrorMessage(error) {
  if (!error?.code) {
    return 'Something went wrong. Please try again.';
  }

  switch (error.code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';

    // 🔐 Hide this case!
    case 'auth/user-not-found':
      return 'If this email is registered, a reset link has been sent.';

    default:
      return 'Something went wrong. Please try again.';
  }
}