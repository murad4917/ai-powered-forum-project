import { GoogleGenAI } from "@google/genai";
import { safeExecute } from "../../../../db/config.js";

import {
  BadRequestError,
  NotFoundError,
  ServiceUnavailableError,
} from "../../../utils/errors/index.js";

const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const RECOMMEND_THRESHOLD =
  Number(process.env.RECOMMEND_THRESHOLD) || 0.75;

const RECOMMEND_K = Number(process.env.RECOMMEND_K) || 5;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set");
}

// NEW SDK INITIALIZATION (using @google/genai)
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

function extractEmbeddingValues(embeddingCandidate) {
  if (Array.isArray(embeddingCandidate)) return embeddingCandidate;
  if (Array.isArray(embeddingCandidate?.values))
    return embeddingCandidate.values;
  if (Array.isArray(embeddingCandidate?.embedding))
    return embeddingCandidate.embedding;
  if (Array.isArray(embeddingCandidate?.embedding?.values))
    return embeddingCandidate.embedding.values;

  if (ArrayBuffer.isView(embeddingCandidate?.values))
    return Array.from(embeddingCandidate.values);
  if (ArrayBuffer.isView(embeddingCandidate))
    return Array.from(embeddingCandidate);

  return [];
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeQuestionText({ title }) {
  return normalizeWhitespace((title || "").normalize("NFKC").toLowerCase());
}
/**
 * Get the current vector search configuration values from environment variables or defaults.
 * @returns {Object} The current vector configuration values.
 */
export function getVectorConfig() {
  return {
    recommendThreshold: RECOMMEND_THRESHOLD,
    recommendK: RECOMMEND_K,
  };
}

function validateEmbedding(embedding) {
  if (!Array.isArray(embedding)) throw new Error("Embedding must be an array");
  if (embedding.length === 0)
    throw new Error("Embedding array cannot be empty");

  if (!embedding.every((v) => typeof v === "number" && !Number.isNaN(v))) {
    throw new Error("Embedding array must contain only valid numbers");
  }
}

export async function storeQuestionVector({
  questionId,
  sourceText = "",
  embedding,
  status,
}) {
  if (status === "failed" || (embedding && embedding.length === 0)) {
    const sql = `
      INSERT INTO question_vectors (
        question_id,
        source_text,
        embedding,
        status
      )
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        source_text = VALUES(source_text),
        embedding = VALUES(embedding),
        status = VALUES(status),
        updated_at = CURRENT_TIMESTAMP
    `;

    await safeExecute(sql, [
      questionId,
      sourceText,
      JSON.stringify([]),
      status,
    ]);

    return;
  }

  validateEmbedding(embedding);

  const embeddingJson = JSON.stringify(embedding);

  const sql = `
    INSERT INTO question_vectors (
      question_id,
      source_text,
      embedding,
      status
    )
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      source_text = VALUES(source_text),
      embedding = VALUES(embedding),
      status = VALUES(status),
      updated_at = CURRENT_TIMESTAMP
  `;

  await safeExecute(sql, [questionId, sourceText, embeddingJson, status]);
}

// generate embedding using NEW SDK
export async function generateQuestionEmbedding(sourceText, options = {}) {
  // keep requested line for compatibility
  const { taskType = "RETRIEVAL_DOCUMENT" } = options;

  if (!sourceText || typeof sourceText !== "string") {
    throw new Error("Source text must be a non-empty string");
  }

  const result = await ai.models.embedContent({
    model: GEMINI_EMBEDDING_MODEL,
    contents: sourceText,
    config: {
      taskType: taskType,
      outputDimensionality: 768,
    },
  });

  let embedding =
    result?.embeddings?.[0]?.values ||
    result?.embedding?.values ||
    result?.embedding ||
    [];

  embedding = extractEmbeddingValues(embedding);

  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Gemini API did not return a valid embedding vector");
  }

  const allNumbers = embedding.every(
    (v) => typeof v === "number" && !Number.isNaN(v),
  );
  if (!allNumbers) {
    throw new Error("Embedding contains invalid numeric values");
  }

  return { embedding };
}

export async function findSimilarQuestionsByText({
  sourceText,
  threshold,
  k,
  excludeQuestionId,
  queryEmbedding,
}) {
  // Normalize parameters
  const normalizedK = k || RECOMMEND_K;
  const normalizedThreshold = threshold || RECOMMEND_THRESHOLD;

  // Use RETRIEVAL_QUERY task type when searching against stored documents
  let embeddingResult;
  if (queryEmbedding) {
    embeddingResult = { embedding: queryEmbedding };
  } else {
    try {
      embeddingResult = await generateQuestionEmbedding(sourceText, {
        taskType: "RETRIEVAL_DOCUMENT",   
      });
    } catch (error) {
      console.error("=== GEMINI API ERROR DURING SEARCH ===");
      console.error("Operation: findSimilarQuestionsByText");
      console.error("Search text:", sourceText);
      console.error("Error:", error);
      console.error("======================================");
      throw new ServiceUnavailableError(
        "Failed to generate embedding for search query. Please try again later.",
      );
    }
  }

  const queryEmbeddingVector = embeddingResult.embedding; //[0.434, 0.234, 0.123, ...]

  // Retrieve all ready embeddings from MySQL
  let storedEmbeddings;
  try {
    storedEmbeddings = await retrieveReadyEmbeddings(); // give all embedding from the database that are ready to use
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }

  const expectedDim = queryEmbeddingVector.length;
  const validEmbeddings = storedEmbeddings.filter((item) => {
    const len = Array.isArray(item.embedding) ? item.embedding.length : -1;
    return len === expectedDim;
  });

  if (validEmbeddings.length !== storedEmbeddings.length) {
    console.warn(
      `Skipping ${storedEmbeddings.length - validEmbeddings.length} embeddings with dimension mismatch (expected ${expectedDim}).`,
    );
  }

  // Calculate cosine similarity for each stored embedding
  const similarities = [];

  for (const stored of validEmbeddings) {
    // Skip the source question so the endpoint never recommends the same question back to itself.
    if (
      excludeQuestionId !== undefined &&
      String(stored.questionId) === String(excludeQuestionId)
    ) {
      continue;
    }
    try {
      const score = calculateCosineSimilarity(
        queryEmbeddingVector,
        stored.embedding,
      );

      // Filter by threshold
      if (score >= normalizedThreshold) {
        similarities.push({
          questionId: stored.questionId,
          score: score,
        });
      }
    } catch (error) {
      console.warn(
        `Failed to calculate similarity for question ${stored.questionId}:`,
        error.message,
      );
      continue;
    }
  }

  // Sort by score descending
  similarities.sort((a, b) => b.score - a.score);

  // Limit to top k results
  const topResults = similarities.slice(0, normalizedK);

  if (topResults.length === 0) {
    return {
      ...embeddingResult,
      similarQuestions: [],
    };
  }

  // Fetch question details using IN clause
  const questionIds = topResults.map((r) => r.questionId);
  const placeholders = questionIds.map(() => "?").join(",");

  const sql = `
  SELECT
    q.question_id AS questionId,
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
  WHERE q.question_id IN (${placeholders})
  GROUP BY q.question_id, u.user_id
`;

  let rows;
  try {
    rows = await safeExecute(sql, questionIds);
  } catch (error) {
    console.error("=== DATABASE ERROR FETCHING QUESTION DETAILS ===");
    console.error("Operation: findSimilarQuestionsByText - fetch details");
    console.error("Question IDs:", questionIds);
    console.error("Error:", error);
    console.error("===============================================");
    throw error;
  }

  // Map MySQL results to question objects
  const questionMap = {};

  rows.forEach((row) => {
    questionMap[String(row.questionId)] = {
      id: row.questionId,
      questionHash: row.questionHash,
      title: row.title,
      content: row.content,
      answerCount: row.answerCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: {
        id: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
      },
    };
  });

  // Return results with scores, preserving sort order
  const similarQuestions = topResults
    .filter((result) => questionMap[String(result.questionId)])
    .map((result) => ({
      score: Number(result.score.toFixed(6)),
      ...questionMap[String(result.questionId)],
    }));

  return {
    ...embeddingResult,
    similarQuestions,
  };
}

export function calculateCosineSimilarity(vectorA, vectorB) {
  // Validate vectors have same length
  if (vectorA.length !== vectorB.length) {
    throw new Error(
      `Vectors must have the same length. Got ${vectorA.length} and ${vectorB.length}`,
    );
  }

  // Calculate dot product (sum of element-wise multiplication)
  let dotProduct = 0;
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
  }

  // Calculate magnitudes (lengths) of vectors
  const magnitudeA = Math.sqrt(
    vectorA.reduce((sum, val) => sum + val * val, 0),
  );
  const magnitudeB = Math.sqrt(
    vectorB.reduce((sum, val) => sum + val * val, 0),
  );

  // Calculate cosine similarity
  const similarity = dotProduct / (magnitudeA * magnitudeB);
  return similarity;
}

async function retrieveReadyEmbeddings() {
  // Query question_vectors table with status='ready' filter
  const sql = `
    SELECT question_id, embedding
    FROM question_vectors
    WHERE status = ?
  `;

  try {
    const rows = await safeExecute(sql, ["ready"]);

    // Parse and validate embeddings
    const embeddings = [];

    for (const row of rows) {
      try {
        // The database driver might already parse JSON columns into objects/arrays.
        // If it's already an array, use it directly; otherwise, parse it.
        const embedding =
          typeof row.embedding === "string"
            ? JSON.parse(row.embedding)
            : row.embedding;

        // Add valid embedding to results
        embeddings.push({
          questionId: row.question_id,
          embedding: embedding,
        });
      } catch (parseError) {
        console.warn(
          `Skipping question ${row.question_id}: failed to parse embedding JSON`,
          parseError,
        );
        continue;
      }
    }

    return embeddings;
  } catch (error) {
    throw error;
  }
}
