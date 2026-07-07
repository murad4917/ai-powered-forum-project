import { body } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

export const chatChatbotValidation = [
  body("message")
    .trim()
    .notEmpty()
    .withMessage("message is required")
    .isString()
    .withMessage("message must be a string")
    .isLength({ max: 2000 })
    .withMessage("message must be at most 2000 characters"),
  body("history")
    .optional()
    .isArray({ max: 20 })
    .withMessage("history must be an array with at most 20 items"),
  body("history.*.role")
    .optional()
    .isIn(["user", "assistant"])
    .withMessage("history role must be user or assistant"),
  body("history.*.content")
    .optional()
    .isString()
    .withMessage("history content must be a string"),
  validationErrorHandler,
];

export const ingestChatbotValidation = [
  body("force").optional().isBoolean().withMessage("force must be a boolean"),
  validationErrorHandler,
];
