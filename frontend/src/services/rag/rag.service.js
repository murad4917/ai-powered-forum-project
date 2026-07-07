import { apiClient } from '../core/api.client.js';

/**
 * Centralized error handler for RAG service requests.
 */
function handleRagError(error, fallbackMessage) {
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

/**
 * Normalizes a document record from the API (snake_case or camelCase).
 * @param {object} raw
 * @returns {object}
 */
function normalizeDocument(raw) {
  if (!raw) return null;
  return {
    documentId: raw.documentId ?? raw.document_id ?? raw.id,
    title: raw.title ?? 'Untitled',
    mimeType: raw.mimeType ?? raw.mime_type ?? null,
    byteSize: raw.byteSize ?? raw.byte_size ?? null,
    status: raw.status ?? 'processing',
    errorMessage: raw.errorMessage ?? raw.error_message ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
  };
}

/**
 * Fetches all documents for the authenticated user.
 * @returns {Promise<Array>}
 */
async function listDocuments() {
  try {
    const response = await apiClient.get('/api/rag/documents');
    const rows = response.data.data ?? [];
    return rows.map(normalizeDocument).filter(Boolean);
  } catch (error) {
    throw handleRagError(error, 'Could not load documents.');
  }
}

/**
 * Uploads a PDF document.
 * @param {File} file
 * @returns {Promise<object>}
 */
async function uploadPdf(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/api/rag/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });

    return normalizeDocument(response.data.data);
  } catch (error) {
    throw handleRagError(error, 'Upload failed.');
  }
}

/**
 * Deletes a document by ID.
 * @param {number|string} documentId
 * @returns {Promise<void>}
 */
async function deleteDocument(documentId) {
  try {
    await apiClient.delete(`/api/rag/documents/${documentId}`);
  } catch (error) {
    throw handleRagError(error, 'Could not delete document.');
  }
}

/**
 * Performs semantic search within a document.
 * @param {number|string} documentId
 * @param {string} query
 * @param {{ k?: number }} [options]
 * @returns {Promise<{ query: string, results: Array }>}
 */
async function searchInDocument(documentId, query, { k } = {}) {
  try {
    const params = { query: query.trim() };
    if (k != null) params.k = k;

    const response = await apiClient.get(
      `/api/rag/documents/${documentId}/search`,
      { params },
    );

    const data = response.data.data ?? {};
    return {
      query: data.query ?? query,
      results: data.results ?? [],
    };
  } catch (error) {
    throw handleRagError(error, 'Search failed.');
  }
}

/**
 * Asks an AI-grounded question about a document.
 * @param {number|string} documentId
 * @param {string} query
 * @returns {Promise<{ answer: string, citations?: Array, chunksUsed?: Array }>}
 */
async function queryDocument(documentId, query) {
  try {
    const response = await apiClient.post(
      `/api/rag/documents/${documentId}/query`,
      { query: query.trim() },
      { timeout: 60000 },
    );

    return response.data.data ?? {};
  } catch (error) {
    throw handleRagError(error, 'Could not get an answer.');
  }
}

/**
 * Reads API error text when axios was configured with responseType: 'blob'.
 */
async function errorFromBlobResponse(error, fallbackMessage) {
  const data = error.response?.data;
  if (!(data instanceof Blob)) {
    return handleRagError(error, fallbackMessage);
  }

  try {
    const text = await data.text();
    const parsed = JSON.parse(text);
    return new Error(parsed.msg || parsed.message || fallbackMessage);
  } catch {
    return new Error(fallbackMessage);
  }
}

/**
 * Fetches the PDF file as a blob object URL for preview.
 * Caller must revoke the URL when done.
 * @param {number|string} documentId
 * @returns {Promise<string>}
 */
async function fetchPdfObjectUrl(documentId) {
  try {
    const response = await apiClient.get(
      `/api/rag/documents/${documentId}/file`,
      { responseType: 'blob', timeout: 60000 },
    );

    return URL.createObjectURL(response.data);
  } catch (error) {
    throw await errorFromBlobResponse(
      error,
      'Could not load document preview.',
    );
  }
}

export const ragService = {
  listDocuments,
  uploadPdf,
  deleteDocument,
  searchInDocument,
  queryDocument,
  fetchPdfObjectUrl,
};
