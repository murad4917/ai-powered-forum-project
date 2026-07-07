import { apiClient } from "../core/api.client.js";

/**
 * Centralized error handler for question service requests.
 */
function handleQuestionError(error) {
  if (!error.response) {
    if (error.code === "ECONNABORTED") {
      return new Error("Request timed out. Please try again.");
    }
    return new Error(
      "Unable to connect to server. Please check your internet connection.",
    );
  }

  const backendMessage =
    error.response.data?.msg || error.response.data?.message;

  return new Error(backendMessage || "Failed to process question request.");
}

/**
 * Fetches questions with optional keyword search and "mine only" filter.
 * @param {{ search?: string, mine?: boolean }} [options]
 * @returns {Promise<Array>}
 */
async function getQuestions({ search, mine } = {}) {
  try {
    const params = {};
    if (search?.trim()) params.search = search.trim();
    if (mine) params.mine = true;

    const response = await apiClient.get("/api/questions", { params });
    return {
      data: response.data.data ?? [],
      meta: response.data.meta,
    };
  } catch (error) {
    throw handleQuestionError(error);
  }
}

/**
 * Creates a new forum question.
 * @param {{ title: string, content: string }} payload
 * @returns {Promise<object>}
 */
async function createQuestion({ title, content }) {
  try {
    const response = await apiClient.post("/api/questions", { title, content });
    return response.data.data;
  } catch (error) {
    throw handleQuestionError(error);
  }
}

async function updateQuestion(questionHash, { title, content }) {
  try {
    const response = await apiClient.put(`/api/questions/${questionHash}`, {
      title,
      content,
    });
    return response.data.data;
  } catch (error) {
    throw handleQuestionError(error);
  }
}

async function deleteQuestion(questionHash) {
  try {
    const response = await apiClient.delete(`/api/questions/${questionHash}`);
    return response.data.data;
  } catch (error) {
    throw handleQuestionError(error);
  }
}

/**
 * Requests AI draft-coach tips for a question draft.
 * @param {{ title?: string, content: string }} payload
 * @returns {Promise<string[]>}
 */
async function generateQuestionDraftCoach({ title, content }) {
  try {
    const response = await apiClient.post("/api/questions/draft-coach", {
      title,
      content,
    });
    return response.data.data.tips ?? [];
  } catch (error) {
    throw handleQuestionError(error);
  }
}

/**
 * Fetches a single question with its answers.
 * @param {string} questionHash
 * @returns {Promise<{ question: object, answers: Array, answersMeta?: object }>}
 */
async function getSingleQuestion(questionHash) {
  try {
    const response = await apiClient.get(`/api/questions/${questionHash}`);
    const data = response.data;

    if (data.question) {
      return {
        question: data.question,
        answers: data.answers ?? [],
        answersMeta: data.answersMeta,
      };
    }

    const { success: _s, message: _m, ...rest } = data;
    if (rest.id && rest.questionHash) {
      return {
        question: rest,
        answers: data.answers ?? [],
        answersMeta: data.answersMeta,
      };
    }

    return {
      question: data.data ?? data,
      answers: data.answers ?? [],
      answersMeta: data.answersMeta,
    };
  } catch (error) {
    throw handleQuestionError(error);
  }
}

/**
 * Evaluates how well a draft answer fits the question (AI).
 * @param {string} questionHash
 * @param {string} answerText
 * @returns {Promise<{ level: string, note: string }>}
 */
async function assessAnswerFit(questionHash, answerText) {
  try {
    const response = await apiClient.post(
      `/api/questions/${questionHash}/answer-fit`,
      { answerText },
    );
    return response.data.data;
  } catch (error) {
    throw handleQuestionError(error);
  }
}

/**
 * Semantic (AI) search across forum questions by natural-language query.
 * @param {string} query
 * @param {{ k?: number, threshold?: number }} [options]
 * @returns {Promise<{ data: Array, meta?: object }>}
 */
async function searchQuestionsSemantic(query, { k, threshold } = {}) {
  try {
    const params = { query: query.trim() };

    if (k !== undefined) params.k = k;
    if (threshold !== undefined) params.threshold = threshold;

    const response = await apiClient.get("/api/questions/search", { params });

    return {
      data: response.data.data ?? [],
      meta: response.data.meta,
    };
  } catch (error) {
    throw handleQuestionError(error);
  }
}

/**
 * Fetches semantically similar questions for the sidebar.
 * @param {string} questionHash
 * @returns {Promise<Array>}
 */
async function getSimilarQuestions(questionHash) {
  try {
    const response = await apiClient.get(
      `/api/questions/${questionHash}/similar`,
    );
    return response.data.data ?? [];
  } catch {
    return [];
  }
}

export const questionService = {
  getQuestions,
  searchQuestionsSemantic,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  generateQuestionDraftCoach,
  getSingleQuestion,
  assessAnswerFit,
  getSimilarQuestions,
};
