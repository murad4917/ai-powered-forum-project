import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { safeExecute } from "../../../../db/config.js";
import {
  embedText,
  cosineSimilarity,
} from "./chatbotEmbedding.service.js";
import { ServiceUnavailableError } from "../../../utils/errors/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_BASE_PATH = path.join(
  __dirname,
  "..",
  "EVANGADI NETWORKS KNOWLEDGE BASE.txt",
);

// Fallback path (repo may be running from a different working directory)
const KNOWLEDGE_BASE_PATH_FALLBACK = path.join(
  __dirname,
  "..",
  "..",
  "EVANGADI NETWORKS KNOWLEDGE BASE.txt",
);

function getKnowledgeBasePath() {
  return KNOWLEDGE_BASE_PATH;
}


const CHATBOT_SEARCH_K = 5;
const GEMINI_GENERATION_MODEL =
  process.env.GEMINI_GENERATION_MODEL ||
  process.env.GEMINI_TEXT_MODEL ||
  "gemini-2.5-flash-lite";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function parseEmbedding(embedding) {
  if (!embedding) return [];
  if (typeof embedding === "string") {
    try {
      return JSON.parse(embedding);
    } catch {
      return [];
    }
  }
  return embedding;
}

/**
 * Split knowledge-base text into meaningful chunks (paragraphs / non-empty lines).
 */
function chunkKnowledgeBaseText(rawText) {
  const chunks = [];
  const blocks = rawText.split(/\n\s*\n/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (trimmed.length >= 20) {
      chunks.push(trimmed);
    }
  }

  if (chunks.length === 0) {
    rawText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length >= 20)
      .forEach((line) => chunks.push(line));
  }

  return chunks;
}

async function countStoredChunks() {
  const rows = await safeExecute(
    "SELECT COUNT(*) AS total FROM chatbot_chunks",
    [],
  );
  return Number(rows[0]?.total ?? 0);
}

async function fetchAllChunksWithEmbeddings() {
  const sql = `
    SELECT chunk_id, chunk_index, content, embedding
    FROM chatbot_chunks
    ORDER BY chunk_index ASC
  `;
  return await safeExecute(sql, []);
}

async function clearStoredChunks() {
  await safeExecute("DELETE FROM chatbot_chunks", []);
}

async function insertChunk({ chunkIndex, content, embedding }) {
  const sql = `
    INSERT INTO chatbot_chunks (chunk_index, content, embedding)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      content = VALUES(content),
      embedding = VALUES(embedding)
  `;
  await safeExecute(sql, [
    chunkIndex,
    content,
    JSON.stringify(embedding),
  ]);
}

function getGeneratedText(response) {
  try {
    const txt = response.text;
    if (typeof txt === "string" && txt.trim()) {
      return txt.trim();
    }
  } catch (err) {
    console.error("[Chatbot] failed to read response.text:", err);
  }

  const parts = response.candidates?.[0]?.content?.parts || [];
  return parts
    .map((part) => part.text || "")
    .join("")
    .trim();
}

function buildChatbotPrompt({ question, chunks, history = [] }) {
  const context = chunks
    .map((chunk, index) => `[${index + 1}] ${chunk.content}`)
    .join("\n\n");

  const historyBlock =
    history.length > 0
      ? history
          .slice(-6)
          .map(
            (turn) =>
              `${turn.role === "user" ? "User" : "Assistant"}: ${turn.content}`,
          )
          .join("\n")
      : "";

  return `
You are the Evangadi Forum assistant. Answer questions about Evangadi Networks using ONLY the knowledge base excerpts below.

Rules:
1. Answer based only on the provided knowledge base excerpts.
2. Be concise, warm, and professional.
3. If the answer is not in the excerpts, respond exactly with:
   "I do not have enough information in my knowledge base to answer that question."
4. Encourage users to visit the official Evangadi website for the latest information when appropriate.
5. Do not invent tuition fees, schedules, or admission requirements.
6. Cite relevant excerpts with bracket references like [1] when helpful.

${historyBlock ? `Recent conversation:\n${historyBlock}\n\n` : ""}Knowledge base excerpts:
${context}

User question:
${question}
`.trim();
}

export async function getChatbotStatusService() {
  const chunkCount = await countStoredChunks();
  return {
    ready: chunkCount > 0,
    chunkCount,
    knowledgeBase: path.basename(KNOWLEDGE_BASE_PATH),
  };
}

export async function ingestKnowledgeBaseService({ force = false } = {}) {
  const existing = await countStoredChunks();
  if (existing > 0 && !force) {
    return {
      skipped: true,
      chunkCount: existing,
      message: "Knowledge base already ingested.",
    };
  }

  let rawText;
  const pathsToTry = [KNOWLEDGE_BASE_PATH, KNOWLEDGE_BASE_PATH_FALLBACK];
  let lastErr;

  for (const p of pathsToTry) {
    try {
      rawText = await fs.readFile(p, "utf8");
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
    }
  }

  if (!rawText) {
    throw new ServiceUnavailableError(
      `Evangadi knowledge base file is missing on the server. (${lastErr?.code ?? "ENOENT"})`,
    );
  }

  return ingestKnowledgeBaseFromTextService({ text: rawText, force });
}

export async function ingestKnowledgeBaseFromTextService({
  text,
  force = false,
}) {
  if (!text || typeof text !== "string") {
    throw new ServiceUnavailableError(
      "Uploaded knowledge base text is empty or invalid.",
    );
  }

  const existing = await countStoredChunks();
  if (existing > 0 && !force) {
    return {
      skipped: true,
      chunkCount: existing,
      message: "Knowledge base already ingested.",
    };
  }

  const chunks = chunkKnowledgeBaseText(text);
  if (chunks.length === 0) {
    throw new ServiceUnavailableError(
      "Knowledge base text did not contain ingestible text.",
    );
  }

  if (force) {
    await clearStoredChunks();
  }

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await embedText(chunks[i], "RETRIEVAL_DOCUMENT");

    if (!Array.isArray(embedding) || embedding.length === 0) {
      console.warn(`[Chatbot-upload] skipping chunk ${i}: invalid embedding`);
      continue;
    }

    await insertChunk({
      chunkIndex: i,
      content: chunks[i],
      embedding,
    });
  }

  return {
    skipped: false,
    chunkCount: chunks.length,
    message: "Knowledge base uploaded + ingested successfully.",
  };
}


async function searchKnowledgeBase(query, k = CHATBOT_SEARCH_K) {
  const queryEmbedding = await embedText(query, "RETRIEVAL_QUERY");

  const stored = await fetchAllChunksWithEmbeddings();

  const ranked = stored
    .map((row) => {
      const emb = parseEmbedding(row.embedding);
      if (!Array.isArray(emb) || emb.length !== queryEmbedding.length) {
        return null;
      }
      return {
        chunkId: row.chunk_id,
        chunkIndex: row.chunk_index,
        content: row.content,
        score: cosineSimilarity(queryEmbedding, emb),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, k);
}

const RETRYABLE_ERRORS = ["429", "RESOURCE_EXHAUSTED", "503", "UNAVAILABLE"];

async function callGeminiWithRetry(fn, attempts = 2) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      const message = String(error?.message ?? error);
      if (
        i < attempts - 1 &&
        RETRYABLE_ERRORS.some((code) => message.includes(code))
      ) {
        const delayMs = Math.max(1500, 16 * 1000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    }
  }
}

export async function queryChatbotService({ message, history = [] }) {
  const question = (message || "").trim();
  if (!question) {
    throw new Error("Message is required.");
  }

  const status = await getChatbotStatusService();
  if (!status.ready) {
    throw new ServiceUnavailableError(
      "Chatbot knowledge base is not ready yet. Please try again shortly.",
    );
  }

  const chunks = await searchKnowledgeBase(question);

  if (chunks.length === 0) {
    return {
      answer:
        "I do not have enough information in my knowledge base to answer that question.",
      citations: [],
    };
  }

  const prompt = buildChatbotPrompt({ question, chunks, history });

  let response;
  try {
    response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: GEMINI_GENERATION_MODEL,
        contents: [prompt],
      }),
    );
  } catch (error) {
    console.error(
      `[Chatbot] query failed (model=${GEMINI_GENERATION_MODEL}):`,
      error?.message ?? error,
    );

    const errorText = String(error?.message ?? error);
    if (
      errorText.includes("429") ||
      errorText.includes("RESOURCE_EXHAUSTED") ||
      errorText.includes("503") ||
      errorText.includes("UNAVAILABLE")
    ) {
      throw new ServiceUnavailableError(
        "AI service is busy. Please wait a moment and try again.",
      );
    }

    throw new ServiceUnavailableError(
      "Failed to generate a chatbot response. Please try again later.",
    );
  }

  try {
    const answer = getGeneratedText(response);
    if (!answer) {
      throw new Error("Gemini response did not include answer text.");
    }

    return {
      answer,
      citations: chunks.map((chunk, index) => ({
        ref: index + 1,
        chunkIndex: chunk.chunkIndex,
        excerpt: chunk.content.slice(0, 160),
      })),
    };
  } catch (error) {
    console.error(
      `[Chatbot] query failed (model=${GEMINI_GENERATION_MODEL}):`,
      error?.message ?? error,
    );

    const errorText = String(error?.message ?? error);
    if (
      errorText.includes("429") ||
      errorText.includes("RESOURCE_EXHAUSTED") ||
      errorText.includes("503") ||
      errorText.includes("UNAVAILABLE")
    ) {
      throw new ServiceUnavailableError(
        "AI service is busy. Please wait a moment and try again.",
      );
    }

    throw new ServiceUnavailableError(
      "Failed to generate a chatbot response. Please try again later.",
    );
  }
}
