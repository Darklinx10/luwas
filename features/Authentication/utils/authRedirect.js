export function getPostLoginRedirect({ isNewUser, role, needsProfileCompletion }) {
  if (isNewUser || needsProfileCompletion || !role) {
    return {
      path: '/profile/edit-profile',
      message: 'Redirecting to complete your profile...',
    };
  }

  if (role === 'MDRRMC-Admin') {
    return {
      path: '/household',
      message: 'Redirecting to Households...',
    };
  }

  return {
    path: '/dashboard',
    message: 'Redirecting to Dashboard...',
  };
}
