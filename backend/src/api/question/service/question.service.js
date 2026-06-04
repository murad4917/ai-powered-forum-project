import crypto from "crypto";
import { safeExecute } from "../../../../db/db.config.js";
import { BadRequestError, NotFoundError } from "../../../utils/errors/index.js";

import {
  generateQuestionEmbedding,
  normalizeQuestionText,
  storeQuestionVector,
} from "./vector.service.js";

// import {
//   findSimilarQuestionsByQuestionId,
//   findSimilarQuestionsByText,
//   generateQuestionEmbedding,
//   getVectorConfig,
//   normalizeQuestionText,
//   storeQuestionVector,
// } from "./vector.service.js";

/**
 * Creates a new question and stores its vector embedding for semantic search.
 * @param {Object} payload - The question data
 * @param {string} payload.userId - ID of the user creating the question
 * @param {string} payload.title - Title of the question
 * @param {string} payload.content - Content/body of the question
 * @returns {Promise<object>} Object containing the created question
 */
export const createQuestionWithVectorService = async (payload) => {
  // Extract required fields from the payload
  const { userId, title, content } = payload;

  // Prepare the SQL statement for inserting a new question
  const insertQuestionSql =
    "INSERT INTO questions (question_hash, user_id, title, content) VALUES (?, ?, ?, ?)";

  // Generate a unique hash for the question
  const questionHash = generateQuestionHash();
  let questionResult;

  try {
    // Execute the insertion query safely
    questionResult = await safeExecute(insertQuestionSql, [questionHash, userId, title, content]);
  } catch (error) {
    // Handle specific foreign key constraint error for non-existent user
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      throw new BadRequestError("User does not exist.");
    }

    // Re-throw any other unexpected errors
    throw error;
  }

  // Retrieve the auto-generated ID of the newly inserted question
  const questionId = questionResult.insertId;

  //construct the question object representing the created question
  const creationResult = {
    id: questionId,
    questionHash,
    title,
    content,
    userId,
  };

  //normalize the question title
  const sourceText = normalizeQuestionText({
    title: payload.title,
  });

  try {
    // Generate the vector embedding for the normalized question text
    const embeddingResult = await generateQuestionEmbedding(sourceText, {
      questionId: creationResult.id,
    });

    // Validate that a valid embedding was returned from the API
    if (
      !embeddingResult ||
      !embeddingResult.embedding ||
      embeddingResult.embedding.length === 0
    ) {
      throw new Error("Gemini API returned an empty or invalid embedding");
    }

    // Store the generated vector embedding in the database with a 'ready' status
    await storeQuestionVector({
      questionId: creationResult.id,
      sourceText,
      embedding: embeddingResult.embedding,
      status: "ready",
    });
  } catch (error) {
    // Log detailed error information if vector generation or storage fails
    console.error("== FAILED TO STORE VECTOR FOR QUESTION ==");
    console.error("Question ID:", creationResult.id);
    console.error("Operation: question creation");
    console.error("Error:", error);
    console.error("========================================");

    // Explicitly record the failure state in the database so it can be retried or tracked later
    await storeQuestionVector({
      questionId: creationResult.id,
      sourceText,
      embedding: [],
      status: "failed",
    }).catch((e) => console.error("Failed to save failed status", e));
  }
  return {
    question: creationResult,
  };
};

// Generate a unique hash for the question
const generateQuestionHash = () => {
  return crypto.randomBytes(8).toString("hex");
};



/**
 * Retrieves questions with optional search filtering. Max 100 records.
 *
 * @param {Object} filters - The filters for the query.
 * @param {string} [filters.search] - The search query.
 * @param {boolean} [filters.mine] - Whether to filter questions by the authenticated user.
 * @param {string} filters.userId - The ID of the authenticated user.
 * @returns {Promise<Object>} Object containing the questions and total count.
 */
export const getQuestionsService = async (filters) => {
  const normalizedLimit = 100; // Fixed max 100 records
  const sortColumn = "q.created_at";
  const normalizedSortOrder = "DESC";

  const { whereClause, params } = buildQuestionFilters(filters);

  const listSql = `
    SELECT
      q.question_id AS id,
      q.question_hash AS questionHash,
      q.title,
      q.content,
      q.created_at AS createdAt,
      q.updated_at AS updatedAt,
      u.user_id AS userId,
      u.first_name AS firstName,
      u.last_name AS lastName,
      COUNT(DISTINCT a.answer_id) AS answerCount
    FROM questions q
    JOIN users u ON u.user_id = q.user_id
    LEFT JOIN answers a ON a.question_id = q.question_id
    ${whereClause}
    GROUP BY q.question_id, u.user_id
    ORDER BY ${sortColumn} ${normalizedSortOrder}
    LIMIT ${normalizedLimit}
  `;
  const rows = await safeExecute(listSql, params);

  return {
    data: rows.map((question) => ({
      id: question.id,
      questionHash: question.questionHash,
      title: question.title,
      content: question.content,
      answerCount: question.answerCount,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      author: {
        id: question.userId,
        firstName: question.firstName,
        lastName: question.lastName,
      },
    })),
    meta: {
      limit: normalizedLimit,
      total: rows.length,
      sortBy: "newest",
      sortOrder: normalizedSortOrder,
    },
  };
};

const buildQuestionFilters = (filters) => {
  const conditions = [];
  const params = [];

  if (filters.search) {
    conditions.push("(q.title LIKE ? OR q.content LIKE ?)");
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (filters.mine && filters.userId) {
    conditions.push("q.user_id = ?");
    params.push(filters.userId);
  }

  if (conditions.length === 0) {
    return { whereClause: "", params };
  }

  return {
    whereClause: `WHERE ${conditions.join(" AND ")}`,
    params,
  };
};