import express from 'express';
import authRoutes from './auth/routes/auth.routes.js';
import questionRoutes from './question/routes/question.routes.js';
import answersRoutes from './answers/routes/answer.routes.js';
import ragRoutes from "./rag/routes/rag.routes.js";
import chatbotRoute from "./chatbot/routes/chatbotRoute.js"

export const mainRouter = express.Router();

// Authentication routes
mainRouter.use("/auth", authRoutes);

// Question routes (Includes standard, semantic search, and draft-coach endpoints)
mainRouter.use("/questions", questionRoutes);
// /api/answers
mainRouter.use("/answers", answersRoutes);

// RAG document routes (upload, search, query, and document management)
mainRouter.use("/rag", ragRoutes);

//chatbot route
mainRouter.use('/chatbot', chatbotRoute);


