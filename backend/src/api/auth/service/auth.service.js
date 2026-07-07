import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { safeExecute } from '../../../../db/config.js';
import {
  BadRequestError,
  UnauthenticatedError,
} from '../../../utils/errors/index.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const normalizeEmail = email => email.trim().toLowerCase();

/**
 * Checks if a user exists by email.
 *
 * @param {string} email - The email to check.
 * @returns {Promise<boolean>} True if the user exists, false otherwise.
 */
export const checkUserExists = async email => {
  const normalizedEmail = normalizeEmail(email);
  const sql = 'SELECT user_id FROM users WHERE email = ? LIMIT 1';
  const rows = await safeExecute(sql, [normalizedEmail]);
  return rows.length > 0;
};

/**
 * Registers a new user in the database.
 *
 * @param {Object} userData - The user data.
 * @param {string} userData.firstName - The first name.
 * @param {string} userData.lastName - The last name.
 * @param {string} userData.email - The email address.
 * @param {string} userData.password - The plain text password.
 * @returns {Promise<Object>} The created user object (without password).
 */
export const registerService = async ({
  firstName,
  lastName,
  email,
  password,
}) => {
  const normalizedEmail = normalizeEmail(email);
  const userExists = await checkUserExists(normalizedEmail);
  if (userExists) {
    throw new BadRequestError('User already exists with this email.');
  }

  // every time we call bcrypt.genSalt, it generates a new random salt string.
  const salt = await bcrypt.genSalt(10); // generates a unique random salt each call
  const hashedPassword = await bcrypt.hash(password, salt);
  const sql =
    'INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)';
  let result;
  try {
    result = await safeExecute(sql, [
      firstName,
      lastName,
      normalizedEmail,
      hashedPassword,
    ]);
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      throw new BadRequestError('User already exists with this email.');
    }
    throw error;
  }

  return {
    id: result.insertId,
    firstName,
    lastName,
    email: normalizedEmail,
  };
};

/**
 * Authenticates a user and generates a JWT token.
 *
 * @param {Object} credentials - The login credentials.
 * @param {string} credentials.email - The user's email.
 * @param {string} credentials.password - The user's plain text password.
 * @returns {Promise<Object>} An object containing the user and token.
 * @throws {UnauthenticatedError} If authentication fails.
 */
export const loginService = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const sql =
    'SELECT user_id, first_name, last_name, email, password_hash, profile_picture_path, dark_mode FROM users WHERE email = ? LIMIT 1';
  const rows = await safeExecute(sql, [normalizedEmail]);

  if (rows.length === 0) {
    throw new UnauthenticatedError('Invalid email or password');
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    throw new UnauthenticatedError('Invalid email or password');
  }

  const payload = {
    id: user.user_id,
    firstName: user.first_name,
    lastName: user.last_name,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    user: {
      id: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      profilePictureUrl: user.profile_picture_path,
      darkMode: user.dark_mode,
    },
    token,
  };
};

/**
 * Changes user password.
 *
 * @param {number} userId - The user ID.
 * @param {string} oldPassword - The user's current password.
 * @param {string} newPassword - The new password.
 * @returns {Promise<Object>} Success message.
 * @throws {UnauthenticatedError} If old password doesn't match.
 */
export const changePasswordService = async (userId, oldPassword, newPassword) => {
  const sql =
    'SELECT password_hash FROM users WHERE user_id = ? LIMIT 1';
  const rows = await safeExecute(sql, [userId]);

  if (rows.length === 0) {
    throw new UnauthenticatedError('User not found');
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(oldPassword, user.password_hash);

  if (!isMatch) {
    throw new UnauthenticatedError('Current password is incorrect');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  const updateSql = 'UPDATE users SET password_hash = ? WHERE user_id = ?';
  await safeExecute(updateSql, [hashedPassword, userId]);

  return { success: true, message: 'Password changed successfully' };
};

/**
 * Gets user profile information.
 *
 * @param {number} userId - The user ID.
 * @returns {Promise<Object>} The user profile object.
 */
export const getUserProfileService = async (userId) => {
  const sql =
    'SELECT user_id, first_name, last_name, email, profile_picture_path, dark_mode FROM users WHERE user_id = ? LIMIT 1';
  const rows = await safeExecute(sql, [userId]);

  if (rows.length === 0) {
    throw new BadRequestError('User not found');
  }

  const user = rows[0];
  return {
    id: user.user_id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    profilePictureUrl: user.profile_picture_path,
    darkMode: user.dark_mode,
  };
};

/**
 * Updates user preferences (dark mode).
 *
 * @param {number} userId - The user ID.
 * @param {boolean} darkMode - Dark mode preference.
 * @returns {Promise<Object>} Updated user object.
 */
export const updateUserPreferencesService = async (userId, darkMode) => {
  const sql = 'UPDATE users SET dark_mode = ? WHERE user_id = ?';
  await safeExecute(sql, [darkMode ? 1 : 0, userId]);

  return {
    id: userId,
    darkMode,
    message: 'Preferences updated successfully',
  };
};

export const updateUserProfileService = async (userId, firstName, lastName) => {
  const sql = 'UPDATE users SET first_name = ?, last_name = ? WHERE user_id = ?';
  await safeExecute(sql, [firstName, lastName, userId]);

  return {
    id: userId,
    firstName,
    lastName,
    message: 'Profile updated successfully',
  };
};

/**
 * Updates user profile picture path.
 *
 * @param {number} userId - The user ID.
 * @param {string} profilePicturePath - The path to the profile picture.
 * @returns {Promise<Object>} Updated user object.
 */
export const updateProfilePictureService = async (userId, profilePicturePath) => {
  const sql = 'UPDATE users SET profile_picture_path = ? WHERE user_id = ?';
  await safeExecute(sql, [profilePicturePath, userId]);

  return {
    id: userId,
    profilePictureUrl: profilePicturePath,
    message: 'Profile picture updated successfully',
  };
};
