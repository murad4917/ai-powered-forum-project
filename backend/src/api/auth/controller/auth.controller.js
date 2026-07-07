import { StatusCodes } from 'http-status-codes';
import {
  registerService,
  loginService,
  changePasswordService,
  getUserProfileService,
  updateUserPreferencesService,
  updateUserProfileService,
  updateProfilePictureService,
} from '../service/auth.service.js';

/**
 * Handles user registration requests.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const registerController = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const newUser = await registerService({
      firstName,
      lastName,
      email,
      password,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'User registered successfully.',
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles user login requests.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const authResult = await loginService({ email, password });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Login successful.',
      user: authResult.user,
      token: authResult.token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles password change requests.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const changePasswordController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    const result = await changePasswordService(userId, oldPassword, newPassword);

    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles getting user profile.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const getUserProfileController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await getUserProfileService(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles updating user profile name fields.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const updateProfileController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName } = req.body;

    const user = await updateUserProfileService(userId, firstName, lastName);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles updating user preferences.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const updateUserPreferencesController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { darkMode } = req.body;

    const result = await updateUserPreferencesService(userId, darkMode);

    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
      user: { darkMode: result.darkMode },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles profile picture upload.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const uploadProfilePictureController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const profilePicturePath = `${req.protocol}://${req.get('host')}/uploads/profile-pictures/${req.file.filename}`;

    const result = await updateProfilePictureService(userId, profilePicturePath);

    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
      user: {
        profilePictureUrl: result.profilePictureUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};
