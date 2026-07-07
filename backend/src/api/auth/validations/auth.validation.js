import { body } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

export const registerValidation = [
  body("firstName")
    .notEmpty()
    .withMessage("First name is required")
    .isString()
    .withMessage("First name must be a string")
    .isLength({ min: 3 })
    .withMessage("First name must be at least 3 characters long"),
  body("lastName")
    .notEmpty()
    .withMessage("Last name is required")
    .isString()
    .withMessage("Last name must be a string")
    .isLength({ min: 3 })
    .withMessage("Last name must be at least 3 characters long"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("A valid email address is required")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  validationErrorHandler,
];

export const loginValidation = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("A valid email address is required")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),

  validationErrorHandler,
];

export const updateProfileValidation = [
  body("firstName")
    .notEmpty()
    .withMessage("First name is required")
    .isString()
    .withMessage("First name must be a string")
    .isLength({ min: 2 })
    .withMessage("First name must be at least 2 characters long"),
  body("lastName")
    .notEmpty()
    .withMessage("Last name is required")
    .isString()
    .withMessage("Last name must be a string")
    .isLength({ min: 2 })
    .withMessage("Last name must be at least 2 characters long"),

  validationErrorHandler,
];

export const changePasswordValidation = [
  body("oldPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),

  validationErrorHandler,
];

export const updatePreferencesValidation = [
  body("darkMode")
    .isBoolean()
    .withMessage("Dark mode must be a boolean value"),

  validationErrorHandler,
];
