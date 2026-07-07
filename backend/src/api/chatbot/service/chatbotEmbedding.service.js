import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set");
}

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

export async function embedText(text, taskType = "RETRIEVAL_DOCUMENT") {
  if (!text || typeof text !== "string") {
    throw new Error("Text must be a non-empty string");
  }

  const result = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: [text],
    config: {
      taskType,
      outputDimensionality: 768,
    },
  });

  const embedding = result.embeddings?.[0]?.values || [];
  const values = extractEmbeddingValues(embedding);

  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Gemini API did not return a valid embedding vector");
  }

  if (!values.every((v) => typeof v === "number" && !Number.isNaN(v))) {
    throw new Error("Embedding contains invalid numeric values");
  }

  return values;
}

export function cosineSimilarity(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dot += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
