import fs from "fs/promises";
import { PDFParse } from "pdf-parse";

/**
 * Read uploaded PDF text from multer file or JSON body.
 *
 * @param {import('express').Request} req
 * @returns {Promise<string>}
 */
export const getUploadedText = async (req) => {
  if (req.file?.buffer) {
    return extractTextFromBuffer(req.file.buffer);
  }

  if (req.file?.path) {
    const buffer = await fs.readFile(req.file.path);
    return extractTextFromBuffer(buffer);
  }

  const error = new Error(
    'Upload a PDF file using form field "file" or send JSON body { "text": "..." }.'
  );

  error.statusCode = 400;
  throw error;
};


/**
 * Extract text from a PDF buffer.
 *
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
async function extractTextFromBuffer(buffer) {
    const parser = new PDFParse({ data: buffer });
  
    try {
      const result = await parser.getText();
      return result.text || "";
    } finally {
      await parser.destroy();
    }
  }
