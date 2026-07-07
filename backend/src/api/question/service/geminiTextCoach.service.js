import { GoogleGenAI } from "@google/genai";
import { ServiceUnavailableError } from "../../../utils/errors/index.js";
// Force the SDK to use the v1beta endpoint pathway
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_TEXT_MODEL =
  process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash-lite";
function parseJsonObjectFromGeminiText(raw) {
  if (!raw || typeof raw !== "string") return null;

  let t = raw.trim();

  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }

  try {
    const v = JSON.parse(t);
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}
async function fetchGeminiJsonTextResponse(userPrompt) {
  const response = await ai.models.generateContent({
    model: GEMINI_TEXT_MODEL,
    contents: userPrompt,
  });

  const text = response.text;
  return typeof text === "string" ? text : "";
}
/**
 *Short coaching tips a question draft (forum/coursework context).
 *@param {{title:string;content:string}}param
 *@returns {promise<{tips:string[]}>}
 */

export const generateQuestionDraftCoachService = async ({ title, content }) => {
  const userPrompt = `You help learners write clearer technical forum posts.

Question TITLE:
${title}

Question BODY (markdown allowed):
${content}

Reply with ONLY valid JSON (no markdown fences), exactly this shape:
{"tips":["...", "..."]}

Rules:
- tips: array of 3 to 5 short strings (each under 120 characters).
- Focus on: missing context (error message, expected vs actual), reproducibility, a sharper title idea if needed, tone for peers.
- Do not claim the question is "correct" or grade homework; give constructive checklist-style tips only.`;

  try {
    const raw = await fetchGeminiJsonTextResponse(userPrompt);
    const parsed = parseJsonObjectFromGeminiText(raw);
    let tips = Array.isArray(parsed?.tips)
      ? parsed.tips
          .filter((t) => typeof t === "string" && t.trim())
          .map((t) => t.trim())
      : [];

    tips = tips.slice(0, 5);

    if (tips.length === 0) {
      tips = [
        "Add any error messages or exact behavior you see.",
        "Say what you already tried and what you expected instead.",
      ];
    }

    return { tips };
  } catch (error) {
    console.error("generateQuestionDraftCoachService:", error);
    throw new ServiceUnavailableError(
      "AI draft coach is temporarily unavailable. Please try again later.",
    );
  }
};
/**
 * Whether a draft answer seems to address the question (relevance, not correctness).
 *
 * @param {{ questionTitle: string; questionContent: string; answerText: string }} param
 * @returns {Promise<{ level: string; note: string }>}
 */
export const assessAnswerAgainstQuestionService = async ({
  questionTitle,
  questionContent,
  answerText,
}) => {
  const userPrompt = `You review whether a forum ANSWER draft addresses the QUESTION (relevance and completeness of engagement - not whether the answer is factually correct).

QUESTION TITLE:
${questionTitle}

QUESTION BODY:
${questionContent}

ANSWER DRAFT:
${answerText}

Reply with ONLY valid JSON (no markdown fences), exactly this shape:
{"level":"strong"|"partial"|"weak","note":"one short sentence"}

Rules:
- level: "strong" if the draft clearly engages with the question; "partial" if somewhat related but missing key parts of the ask; "weak" if mostly off-topic or too vague.
- note: one sentence, plain language, no markdown, under 200 characters. Frame as fit/relevance, not grading.`;

  try {
    const raw = await fetchGeminiJsonTextResponse(userPrompt);
    const parsed = parseJsonObjectFromGeminiText(raw);

    const levelRaw = parsed?.level;
    const noteRaw = parsed?.note;

    const level =
      levelRaw === "strong" || levelRaw === "partial" || levelRaw === "weak"
        ? levelRaw
        : "partial";
    const note =
      typeof noteRaw === "string" && noteRaw.trim()
        ? noteRaw.trim().slice(0, 200)
        : "Could not summarize fit; treat this as a partial match.";

    return { level, note };
  } catch (error) {
    console.error("assessAnswerAgainstQuestionService:", error);

    throw new ServiceUnavailableError(
      "AI fit check is temporarily unavailable. Please try again later.",
    );
  }
};
