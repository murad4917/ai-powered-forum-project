import { StatusCodes } from "http-status-codes";
import {
  ingestKnowledgeBaseService,
  ingestKnowledgeBaseFromTextService,
  queryChatbotService,
  getChatbotStatusService,
} from "../service/chatbotService.js";


/**
 * POST /api/chatbot/ingest
 * Reads EVANGADI NETWORKS KNOWLEDGE BASE.txt, chunks, embeds, and stores vectors.
 */
export const ingestChatbotController = async (req, res, next) => {
  try {
    const force = req.body?.force === true;
    const data = await ingestKnowledgeBaseService({ force });

    res.status(StatusCodes.OK).json({
      success: true,
      message: data.message,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/chatbot/status
 * Returns whether the knowledge base has been ingested.
 */
export const getChatbotStatusController = async (req, res, next) => {
  try {
    const data = await getChatbotStatusService();

    res.status(StatusCodes.OK).json({
      success: true,
      message: data.ready
        ? "Chatbot knowledge base is ready."
        : "Chatbot knowledge base is not ingested yet.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/chatbot/chat
 * Authenticated users ask questions grounded in the Evangadi knowledge base.
 */
export const chatChatbotController = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    const data = await queryChatbotService({ message, history });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Chatbot response generated.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/chatbot/upload
 * Upload a .txt knowledge base file, chunk it, embed chunks, and store into chatbot_chunks.
 */
export const uploadChatbotTextController = async (req, res, next) => {
  try {
    const force = req.body?.force === true || req.body?.force === "true";

    const text = req.file?.buffer?.toString("utf8") || "";
    const data = await ingestKnowledgeBaseFromTextService({ text, force });

    res.status(StatusCodes.OK).json({
      success: true,
      message: data.message,
      data,
    });
  } catch (error) {
    next(error);
  }
};

