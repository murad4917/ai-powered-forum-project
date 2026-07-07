import express from 'express';
import {
  registerController,
  loginController,
  changePasswordController,
  getUserProfileController,
  updateUserPreferencesController,
  uploadProfilePictureController,
  updateProfileController,
} from '../controller/auth.controller.js';
import {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  updatePreferencesValidation,
  updateProfileValidation,
} from '../validations/auth.validation.js';
import { authenticateUser } from '../../../middleware/authentication.js';
import {
  profilePictureUpload,
  profileUploadErrorHandler,
} from '../../../middleware/profile.upload.js';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', registerValidation, registerController);

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get token
 * @access Public
 */
router.post('/login', loginValidation, loginController);

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticateUser, getUserProfileController);

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile name fields
 * @access Private
 */
router.put(
  '/profile',
  authenticateUser,
  updateProfileValidation,
  updateProfileController
);

/**
 * @route POST /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post(
  '/change-password',
  authenticateUser,
  changePasswordValidation,
  changePasswordController
);

/**
 * @route PUT /api/auth/preferences
 * @desc Update user preferences (dark mode, etc.)
 * @access Private
 */
router.put(
  '/preferences',
  authenticateUser,
  updatePreferencesValidation,
  updateUserPreferencesController
);

/**
 * @route POST /api/auth/upload-profile-picture
 * @desc Upload profile picture
 * @access Private
 */
router.post(
  '/upload-profile-picture',
  authenticateUser,
  profilePictureUpload.single('file'),
  uploadProfilePictureController,
);

router.use(profileUploadErrorHandler);

export default router;
