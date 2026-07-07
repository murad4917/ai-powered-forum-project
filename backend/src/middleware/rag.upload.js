import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { StatusCodes } from "http-status-codes";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const RAG_UPLOAD_FIELD_NAME = "file";
export const RAG_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const RAG_UPLOADS_ROOT = path.join(__dirname, "../../rag-uploads");

const MAX_FILE_SIZE_MB = RAG_MAX_FILE_SIZE_BYTES / (1024 * 1024);

const PDF_MIME_TYPE = "application/pdf";

function isPdfFile(file) {
  return (
    file.mimetype === PDF_MIME_TYPE ||
    file.originalname.toLowerCase().endsWith(".pdf")
  );
}

const uploadPdfFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: RAG_MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!isPdfFile(file)) {
      return cb(new Error("Only PDF files are allowed."));
    }
    cb(null, true);
  },
}).single(RAG_UPLOAD_FIELD_NAME);

export const handlePdfUpload = (req, res, next) => {
  uploadPdfFile(req, res, (err) => {
    if (err) {
      return next(err);
    }

    if (!req.file) {
      return next(new Error("PDF file is required."));
    }

    next();
  });
};

/**
 * Writes the in-memory upload to disk for long-term storage and processing.
 * @returns {Promise<string|null>} Relative path (e.g. "1/uuid.pdf")
 */
export async function persistMemoryUpload(req) {
  const userId = req.user?.id;
  const file = req.file;

  if (!userId || !file?.buffer) {
    return null;
  }

  const userUploadDir = path.join(RAG_UPLOADS_ROOT, String(userId));
  await fs.mkdir(userUploadDir, { recursive: true });

  const extension = path.extname(file.originalname).toLowerCase() || ".pdf";
  const filename = `${crypto.randomUUID()}${extension}`;
  const absolutePath = path.join(userUploadDir, filename);

  await fs.writeFile(absolutePath, file.buffer);

  file.path = absolutePath;
  file.filename = filename;

  return `${userId}/${filename}`;
}

/**
 * Handles multer upload failures (file type, size, missing file).
 */
export const createDocumentMulterErrorHandler = (err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: `File exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`,
      });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: `Upload field must be named "${RAG_UPLOAD_FIELD_NAME}".`,
      });
    }

    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: err.message,
    });
  }

  return res.status(StatusCodes.BAD_REQUEST).json({
    msg: err.message || "Invalid file upload.",
  });
};
