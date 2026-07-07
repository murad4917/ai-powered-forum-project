import multer from "multer";
import { StatusCodes } from "http-status-codes";

export const CHATBOT_TEXT_UPLOAD_FIELD_NAME = "file";

const TEXT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function isTxtFile(file) {
  return (
    file?.mimetype === "text/plain" ||
    (file?.originalname && file.originalname.toLowerCase().endsWith(".txt"))
  );
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TEXT_MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!isTxtFile(file)) {
      return cb(new Error("Only .txt files are allowed."));
    }
    cb(null, true);
  },
}).single(CHATBOT_TEXT_UPLOAD_FIELD_NAME);

export const handleChatbotTextUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: err.message || "Invalid upload",
      });
    }

    if (!req.file?.buffer) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `file is required (form-data field name: '${CHATBOT_TEXT_UPLOAD_FIELD_NAME}')`,
      });
    }

    next();
  });
};

