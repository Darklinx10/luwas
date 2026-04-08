// services/userProfileServices.js
/**
 * Profile services - handles profile-related API calls
 *
 * All profile updates go through server-side validation via /api/profile/update
 * NO client-side Firestore writes for profile data
 */

function sanitizePersistedProfilePhoto(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('blob:')) {
    return '';
  }

  return trimmed;
}

// 🔐 Update user profile through server-side API
// Server validates permissions, sanitizes input, and updates Firestore safely
export async function updateUserProfile(profileData, photoFile) {
  try {
    // 1. If there's a photo file, upload separately and get URL
    let profilePhotoUrl = sanitizePersistedProfilePhoto(profileData.profilePhoto);

    if (photoFile) {
      // Photo upload would happen here
      // For now, local preview is allowed but no upload happens yet.
      // TODO: Create /api/profile/upload-photo endpoint
      console.warn('Custom profile photo upload is not implemented yet; only stable non-blob URLs can be saved.');
    }

    // 2. Prepare data for server (exclude sensitive fields)
    const updatePayload = {
      firstName: profileData.firstName,
      middleName: profileData.middleName,
      lastName: profileData.lastName,
      dateOfBirth: profileData.dateOfBirth,
      gender: profileData.gender,
      contactNumber: profileData.contactNumber,
      barangay: profileData.barangay,
      profilePhoto: profilePhotoUrl,
    };

    // 3. Call server-side update endpoint
    const response = await fetch('/api/profile/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',  // Send session cookies
      body: JSON.stringify(updatePayload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update profile');
    }

    // 4. Return updated profile from server
    return data.profile;
  } catch (error) {
    console.error('updateUserProfile error:', error);
    throw error;
  }
}

// 🔐 Fetch user profile (via session API)
// Gets profile from /api/auth/me which returns current user data
export async function fetchUserProfile() {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',  // Send session cookies
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('fetchUserProfile error:', error);
    return null;
  }
}
