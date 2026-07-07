import { apiClient } from '../core/api.client.js';

/**
 * Registers a new user.
 * @param {Object} userData - User details for registration.
 */
async function register(userData) {
  try {
    const response = await apiClient.post('/api/auth/register', userData);
    return { user: response.data.user };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Logs in an existing user and stores their session in localStorage.
 * @param {Object} credentials - User login credentials.
 */
async function login(credentials) {
  try {
    const response = await apiClient.post('/api/auth/login', credentials);
    const { user, token } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return { user, token };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Logs out the current user by clearing localStorage.
 */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/**
 * Retrieves the stored JWT token from localStorage.
 */
function getStoredToken() {
  return localStorage.getItem('token');
}

/**
 * Retrieves the stored user object from localStorage.
 */
function getStoredUser() {
  const userJson = localStorage.getItem('user');
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch (error) {
    // If JSON parsing fails, clear invalid data
    localStorage.removeItem('user');
    return null;
  }
}

/**
 * Checks if the user is currently authenticated based on local storage.
 */
function isAuthenticated() {
  return !!getStoredToken();
}

/**
 * Centralized error handler for auth service requests.
 */
function handleAuthError(error) {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return new Error('Request timed out. Please try again.');
    }
    return new Error(
      'Unable to connect to server. Please check your internet connection.',
    );
  }

  const status = error.response.status;
  const backendMessage =
    error.response.data?.msg || error.response.data?.message;

  switch (status) {
    case 400:
      return new Error(backendMessage || 'Invalid input data.');
    case 401:
      return new Error(backendMessage || 'Invalid email or password.');
    case 500:
      return new Error(
        'Something went wrong on our end. Please try again later.',
      );
    default:
      return new Error(backendMessage || 'An unexpected error occurred.');
  }
}

/**
 * Changes the user's password.
 * @param {string} oldPassword - The current password.
 * @param {string} newPassword - The new password.
 */
async function changePassword(oldPassword, newPassword) {
  try {
    const response = await apiClient.post('/api/auth/change-password', {
      oldPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Uploads a profile picture for the user.
 * @param {File} file - The image file to upload.
 */
async function uploadProfilePicture(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(
      '/api/auth/upload-profile-picture',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Updates the user profile name fields.
 * @param {Object} profile - { firstName, lastName }
 */
async function updateProfile(profile) {
  try {
    const response = await apiClient.put('/api/auth/profile', profile);
    return response.data;
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Updates user preferences.
 * @param {Object} preferences - User preferences (e.g., { darkMode: true })
 */
async function updatePreferences(preferences) {
  try {
    const response = await apiClient.put('/api/auth/preferences', preferences);
    return response.data;
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Gets the current user's profile.
 */
async function getUserProfile() {
  try {
    const response = await apiClient.get('/api/auth/profile');
    return response.data;
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Service for handling auth-related requests.
 */
export const authService = {
  register,
  login,
  logout,
  getStoredToken,
  getStoredUser,
  isAuthenticated,
  changePassword,
  uploadProfilePicture,
  updateProfile,
  updatePreferences,
  getUserProfile,
};
