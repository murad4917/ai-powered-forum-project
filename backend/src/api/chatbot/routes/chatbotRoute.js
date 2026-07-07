import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import {
  chatChatbotController,
  getChatbotStatusController,
  ingestChatbotController,
  uploadChatbotTextController,
} from "../controller/chatbotController.js";
import {
  chatChatbotValidation,
  ingestChatbotValidation,
} from "../validations/chatbotValidation.js";
import { handleChatbotTextUpload } from "../../../middleware/chatbotTextUpload.js";

const router = express.Router();

/**
 * @route POST /api/chatbot/ingest
 * @desc Ingest EVANGADI NETWORKS KNOWLEDGE BASE.txt into chatbot vectors
 * @access Protected
 */
router.post(
  "/ingest",
  authenticateUser,
  ingestChatbotValidation,
  ingestChatbotController,
);

/**
 * @route GET /api/chatbot/status
 * @desc Check whether chatbot knowledge base is ready
 * @access Protected
 */
router.get("/status", authenticateUser, getChatbotStatusController);

/**
 * @route POST /api/chatbot/chat
 * @desc Ask the Evangadi assistant a question
 * @access Protected
 */
router.post(
  "/chat",
  authenticateUser,
  chatChatbotValidation,
  chatChatbotController,
);

/**
 * @route POST /api/chatbot/upload
 * @desc Upload a .txt knowledge base file
 * @access Protected
 */
router.post(
  "/upload",
  authenticateUser,
  handleChatbotTextUpload,
  uploadChatbotTextController,
);

export default router;