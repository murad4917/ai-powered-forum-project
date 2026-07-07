import { apiClient } from '../core/api.client.js';

function handleChatbotError(error, fallbackMessage) {
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

  return new Error(backendMessage || fallbackMessage);
}

async function getStatus() {
  try {
    const response = await apiClient.get('/api/chatbot/status');
    return response.data.data ?? { ready: false };
  } catch (error) {
    throw handleChatbotError(error, 'Could not get chatbot status.');
  }
}

async function sendMessage(message, history = []) {
  try {
    const response = await apiClient.post('/api/chatbot/chat', { message, history });
    return response.data.data ?? { answer: '' };
  } catch (error) {
    throw handleChatbotError(error, 'Could not send message.');
  }
}

export const chatbotService = {
  getStatus,
  sendMessage,
};