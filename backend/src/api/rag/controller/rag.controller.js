import path from "node:path";
import fs from "node:fs/promises";
import { StatusCodes } from "http-status-codes";
import {
  persistMemoryUpload,
  RAG_UPLOADS_ROOT,
} from "../../../middleware/rag.upload.js";
import { getUploadedText } from "../../../utils/errors/ingest-pdf.js";
import { BadRequestError, NotFoundError } from "../../../utils/errors/index.js";
import {
  createDocumentFromUploadService,
  deleteDocumentService,
  searchInDocumentService,
  queryDocumentService,
  listDocumentsForUserService,
  getDocumentMetaService,
  assertOwnedDocument,
} from "../service/rag.service.js";
/**
 * Handles POST /api/rag/documents — delegates upload processing to the service layer.
 */
export const createDocumentController = async (req, res, next) => {
  try {
    await getUploadedText(req);

    const storagePath = await persistMemoryUpload(req);

    if (!storagePath) {
      throw new BadRequestError("Uploaded file storage path is missing.");
    }

    const data = await createDocumentFromUploadService({
      userId: req.user.id,
      file: req.file,
      storagePath,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Document uploaded and processed.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * T-24: List RAG Documents Controller
 * Handles GET /api/rag/documents
 */
export const listDocumentsController = async (req, res, next) => {
  try {
    const userId = req.user.id; // Get authenticated user id from middleware
    const data = await listDocumentsForUserService(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Documents fetched successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles DELETE /api/rag/documents/:documentId
 */
export const deleteDocumentController = async (req, res, next) => {
  try {
    const deletedDocument = await deleteDocumentService({
      userId: req.user.id,
      documentId: req.params.documentId,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Document deleted successfully.",
      data: deletedDocument,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ======================================================
 * T-23: Semantic Search in RAG Document Controller
 * Endpoint: GET /api/rag/documents/:documentId/search
 * ======================================================
 */
export const searchInDocumentController = async (req, res, next) => {
  try {
    const documentId = parseInt(req.params.documentId, 10);
    const query = req.query.query;
    const k = req.query.k ? parseInt(req.query.k, 10) : 5;
    const data = await searchInDocumentService({
      documentId,
      query,
      k,
      userId: req.user.id,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Ranked chunk excerpts",
      data,
    });
  } catch (error) {
    next(error);
  }
};






/**
 * Handles POST /api/rag/documents/:documentId/query
 */
export const queryDocumentController = async (req, res, next) => {
  try {
    const answerPayload = await queryDocumentService({
      userId: req.user.id,
      documentId: req.params.documentId,
      query: req.body.query,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Answer and citations",
      data: answerPayload,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /api/rag/documents/:documentId
 */
export const getDocumentMetaController = async (req, res, next) => {
  try {
    const data = await getDocumentMetaService(
      Number(req.params.documentId),
      req.user.id,
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Document metadata fetched successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// T-24 STRIMIN RAG PDF
// T-24: GET /api/rag/documents/:documentId/file
export const getDocumentFileController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const documentId = Number(req.params?.documentId);
    if (!userId) {
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      throw err;
    }
    // 1. verify ownership + get document
    const doc = await assertOwnedDocument({ documentId, userId });
    const absPath = path.resolve(RAG_UPLOADS_ROOT, doc.storage_path);

    if (
      absPath !== RAG_UPLOADS_ROOT &&
      !absPath.startsWith(`${RAG_UPLOADS_ROOT}${path.sep}`)
    ) {
      throw new BadRequestError("Invalid document storage path.");
    }

    try {
      await fs.access(absPath);
    } catch {
      throw new NotFoundError(
        "Document file not found on server. Delete this entry and upload the PDF again.",
      );
    }
    // 4. headers
    res.setHeader("Content-Type", doc.mime_type || "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(doc.title || "document.pdf")}"`,
    );
    // 5. stream file
    return res.sendFile(absPath);
  } catch (error) {
    next(error);
  }
};

// export const getDocumentFileController = async (req, res, next) => {
//   try {
//     const userId = req.user?.id;
//     const documentId = Number(req.params.documentId);
//     if (!userId) {
//       const err = new Error("Unauthorized");
//       err.statusCode = 401;
//       throw err;
//     }
//     // 1. verify ownership + get document
//     const doc = await assertOwnedDocument({ documentId, userId });
//     const absPath = path.resolve(RAG_UPLOADS_ROOT, doc.storage_path);
//     if (
//       absPath !== RAG_UPLOADS_ROOT &&
//       !absPath.startsWith(`${RAG_UPLOADS_ROOT}${path.sep}`)
//     ) {
//       throw new BadRequestError("Invalid document storage path.");
//     }
//     try {
//       await fs.access(absPath);
//     } catch {
//       throw new NotFoundError(
//         "Document file not found on server. Delete this entry and upload the PDF again.",
//       );
//     }
//     // 4. headers
//     res.setHeader("Content-Type", doc.mime_type || "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `inline; filename="${encodeURIComponent(doc.title || "document.pdf")}"`,
//     );
//     // 5. stream file
//     return res.sendFile(absPath);
//   } catch (error) {
//     next(error);
//   }
// };
