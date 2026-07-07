import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";
import {
  createDocumentMulterErrorHandler,
  handlePdfUpload,
} from "../../../middleware/rag.upload.js";

import {
  documentIdParamValidation,
  queryDocumentValidation,
  getDocumentFileValidation,
  documentIdValidation,
  searchDocumentValidation,
  
} from "../validation/rag.validation.js";

import {
  createDocumentController,
  deleteDocumentController,
  listDocumentsController,
  queryDocumentController,
  getDocumentMetaController,
  getDocumentFileController,
  searchInDocumentController,

} from "../controller/rag.controller.js";


const router = express.Router();
/**
 * @route POST /api/rag/documents
 * @desc Upload and process a PDF document for RAG
 * @access Protected
 */
router.post(
  "/documents",
  authenticateUser,
  handlePdfUpload,
  createDocumentController,
);

router.use(createDocumentMulterErrorHandler);

/**
 * T-24: List RAG Documents Route
 * @route GET /api/rag/documents
 * @access Protected
 */
router.get("/documents", authenticateUser, listDocumentsController);

/**
 * T-23: Semantic Search Route
 * @route GET /api/rag/documents/:documentId/search
 * @access Protected
 */
router.get(
  "/documents/:documentId/search",
  authenticateUser,
  searchDocumentValidation,
  searchInDocumentController,
);

/**
 * @route POST /api/rag/documents/:documentId/query
 * @desc Generate an AI answer grounded in the most relevant chunks of one document
 * @access Protected
 */
router.post(
  "/documents/:documentId/query",
  authenticateUser,
  queryDocumentValidation,
  queryDocumentController,
);

/**
 * @route GET /api/rag/documents/:documentId/file
 * @desc Stream the stored PDF for inline preview
 * @access Protected
 */
router.get(
  "/documents/:documentId/file",
  authenticateUser,
  getDocumentFileValidation,
  getDocumentFileController,
);

router.get(
  "/documents/:documentId",
  authenticateUser,
  documentIdParamValidation,
  validationErrorHandler,
  getDocumentMetaController,
);
router.get(
  "/documents/:documentId/file",
  authenticateUser,
  getDocumentFileValidation,
  getDocumentFileController,
);

/**
 * @route DELETE /api/rag/documents/:documentId
 * @desc Delete one owned RAG document and its stored PDF
 * @access Protected
 */
router.delete(
  "/documents/:documentId",
  authenticateUser,
  documentIdValidation,
  deleteDocumentController,
);

export default router;
