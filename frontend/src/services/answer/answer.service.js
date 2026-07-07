import { apiClient } from '../core/api.client.js';

function handleAnswerError(error) {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return new Error('Request timed out. Please try again.');
    }
    return new Error(
      'Unable to connect to server. Please check your internet connection.',
    );
  }

  const backendMessage =
    error.response.data?.msg || error.response.data?.message;

  return new Error(backendMessage || 'Failed to process answer request.');
}

/**
 * Posts a new answer to a question.
 * @param {number} questionId
 * @param {string} content
 * @returns {Promise<object>}
 */
async function postAnswer(questionId, content) {
  try {
    const response = await apiClient.post('/api/answers', {
      questionId,
      content,
    });
    return response.data.data;
  } catch (error) {
    throw handleAnswerError(error);
  }
}

/**
 * Updates an existing answer.
 * @param {number} answerId
 * @param {string} content
 * @returns {Promise<object>}
 */
async function updateAnswer(answerId, content) {
  try {
    const response = await apiClient.patch(`/api/answers/${answerId}`, {
      content,
    });
    return response.data.data;
  } catch (error) {
    throw handleAnswerError(error);
  }
}

/**
 * Deletes an existing answer.
 * @param {number} answerId
 * @returns {Promise<object>}
 */
async function deleteAnswer(answerId) {
  try {
    const response = await apiClient.delete(`/api/answers/${answerId}`);
    return response.data.data;
  } catch (error) {
    throw handleAnswerError(error);
  }
}

export const answerService = {
  postAnswer,
  updateAnswer,
  deleteAnswer,
};
