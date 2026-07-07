// ======================================================
// T-23: Semantic Search Validation
// Endpoint: GET /api/rag/documents/:documentId/search
// ======================================================

import { param, query, body } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";


export const searchDocumentValidation = [
  // Validate documentId
  param("documentId")
    .isInt()
    .withMessage("documentId must be an integer"),
  // Validate search query
  query("query")
    .trim()
    .notEmpty()
    .withMessage("query is required")
    .isString()
    .withMessage("query must be a string"),
  // Validate k
  query("k")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("k must be a number between 1 and 5"),
  validationErrorHandler,
];

export const documentIdParamValidation = [
  param("documentId")
    .exists()
    .withMessage("documentId is required")
    .isInt({ min: 1 })
    .withMessage("documentId must be a positive integer"),
  validationErrorHandler,
];


export const documentIdValidation = documentIdParamValidation;

export const queryDocumentValidation = [
  ...documentIdParamValidation.slice(0, -1),
  body("query")
    .isString()
    .withMessage("query must be a string")
    .trim()
    .isLength({ min: 3, max: 1000 })
    .withMessage("query must be between 3 and 1000 characters"),
  validationErrorHandler,
];

export const getDocumentFileValidation = [...documentIdParamValidation];
