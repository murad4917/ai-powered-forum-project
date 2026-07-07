/**
 * Knowledge Base (RAG): upload PDFs, preview, semantic search, and AI-grounded Q&A.
 * Data: `ragService` — list, upload, delete, search, query, PDF preview.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FileText,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import RagAnswerBody from "../../components/RagAnswerBody/RagAnswerBody.jsx";
import { ragService } from "../../services/rag/rag.service.js";
import styles from "./RagDocuments.module.css";

const POLL_INTERVAL_MS = 4000;

function formatBytes(bytes) {
  if (!bytes || Number.isNaN(bytes)) return "";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

function statusBadgeClass(status) {
  if (status === "ready") return styles["badge--ready"];
  if (status === "failed") return styles["badge--failed"];
  return styles["badge--processing"];
}

function statusLabel(status) {
  if (status === "ready") return "READY";
  if (status === "failed") return "FAILED";
  return "PROCESSING";
}

export default function RagDocuments() {
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [pdfUrl, setPdfUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  const [askQuery, setAskQuery] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState(null);
  const [askAnswer, setAskAnswer] = useState(null);

  const activeDocument =
    documents.find((doc) => doc.documentId === selectedId) ?? null;
  const isReady = activeDocument?.status === "ready";

  const loadDocuments = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setListLoading(true);
      setListError(null);
    }

    try {
      const data = await ragService.listDocuments();
      setDocuments(data);
      setListError(null);
      return data;
    } catch (err) {
      if (silent) {
        setListError(err?.message || "Could not load documents.");
        setDocuments([]);
      }
      return null;
    } finally {
      if (!silent) {
        setListLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    const hasProcessing = documents.some((doc) => doc.status === "processing");
    if (!hasProcessing) return undefined;

    const timer = window.setInterval(() => {
      loadDocuments({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [documents, loadDocuments]);

  useEffect(() => {
    if (!selectedId || !isReady) {
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setPreviewLoading(false);
      setPreviewError(null);
      return undefined;
    }

    let cancelled = false;

    async function loadPreview() {
      setPreviewLoading(true);
      setPreviewError(null);
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });

      try {
        const url = await ragService.fetchPdfObjectUrl(selectedId);
        if (!cancelled) {
          setPdfUrl(url);
        } else {
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        if (!cancelled) {
          setPreviewError(err?.message || 'Could not load document preview.');
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [selectedId, isReady]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  useEffect(() => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
    setAskQuery("");
    setAskAnswer(null);
    setAskError(null);
  }, [selectedId]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const created = await ragService.uploadPdf(selectedFile);
      setDocuments((prev) => [
        created,
        ...prev.filter((d) => d.documentId !== created.documentId),
      ]);
      setSelectedId(created.documentId);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setUploadError(err?.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId, event) => {
    event.stopPropagation();
    if (deletingId) return;

    setDeletingId(documentId);

    try {
      await ragService.deleteDocument(documentId);
      setDocuments((prev) =>
        prev.filter((doc) => doc.documentId !== documentId),
      );
      if (selectedId === documentId) {
        setSelectedId(null);
      }
    } catch (err) {
      setListError(err?.message || "Could not delete document.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!activeDocument || !isReady || !searchQuery.trim() || searchLoading) {
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const data = await ragService.searchInDocument(
        activeDocument.documentId,
        searchQuery,
      );
      setSearchResults(data.results ?? []);
    } catch (err) {
      setSearchError(err?.message || "Search failed.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAsk = async (event) => {
    event.preventDefault();
    if (!activeDocument || !isReady || !askQuery.trim() || askLoading) {
      return;
    }

    setAskLoading(true);
    setAskError(null);
    setAskAnswer(null);

    try {
      const data = await ragService.queryDocument(
        activeDocument.documentId,
        askQuery,
      );
      setAskAnswer(data.answer ?? "");
    } catch (err) {
      setAskError(err?.message || "Could not get an answer.");
    } finally {
      setAskLoading(false);
    }
  };

  const renderDocumentList = () => {
    if (listLoading) {
      return (
        <p className={styles.listLoading} aria-live="polite">
          Loading your library...
        </p>
      );
    }

    if (documents.length === 0) {
      return (
        <p className={styles.listEmpty}>
          Your library is empty. Upload a PDF to index it for search and Q&A.
        </p>
      );
    }

    return (
      <ul className={styles.docList} aria-label="Uploaded documents">
        {documents.map((doc) => {
          const isSelected = doc.documentId === selectedId;
          return (
            <li key={doc.documentId}>
              <div
                className={`${styles.docItem} ${isSelected ? styles["docItem--selected"] : ""}`}
              >
                <button
                  type="button"
                  className={styles.docItem__select}
                  onClick={() => setSelectedId(doc.documentId)}
                  aria-pressed={isSelected}
                >
                  <span className={styles.docItem__main}>
                    <span className={styles.docItem__title}>{doc.title}</span>
                    <span
                      className={`${styles.badge} ${statusBadgeClass(doc.status)}`}
                    >
                      {statusLabel(doc.status)}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={(e) => handleDelete(doc.documentId, e)}
                  disabled={deletingId === doc.documentId}
                  aria-label={`Delete ${doc.title}`}
                >
                  {deletingId === doc.documentId ? (
                    <Loader2 size={16} className={styles.spin} aria-hidden />
                  ) : (
                    <Trash2 size={16} aria-hidden />
                  )}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderRightColumn = () => {
    if (!activeDocument) {
      return (
        <p className={styles.rightEmpty}>
          Choose a document from the library to open the reader, run semantic
          search over its text, and ask questions with AI-assisted answers
          grounded in that file.
        </p>
      );
    }

    if (activeDocument.status !== "ready") {
      return (
        <div className={styles.pendingState} role="status">
          This document is not ready for preview or AI tools. Current status:{" "}
          <strong>{activeDocument.status}</strong>.
        </div>
      );
    }

    return (
      <div className={styles.activeView}>
        <section aria-labelledby="reader-title">
          <h2 id="reader-title" className={styles.section__title}>
            Reader
          </h2>
          <p className={styles.section__subtitle}>
            Inline preview of the selected PDF.
          </p>
          {previewLoading ? (
            <div className={styles.previewLoading} aria-live="polite">
              Loading document preview...
            </div>
          ) : previewError ? (
            <div className={styles.previewError} role="alert">
              {previewError}
            </div>
          ) : pdfUrl ? (
            <iframe
              title={`Preview of ${activeDocument.title}`}
              src={pdfUrl}
              className={styles.previewFrame}
            />
          ) : null}
        </section>

        <section aria-labelledby="search-title">
          <h2 id="search-title" className={styles.section__title}>
            Semantic search
          </h2>
          <p className={styles.section__subtitle}>
            Finds passages by meaning (embeddings), not only exact keywords.
          </p>
          <form onSubmit={handleSearch}>
            <div className={styles.field}>
              <label htmlFor="search-query" className={styles.field__label}>
                Search query
              </label>
              <input
                id="search-query"
                type="text"
                className={styles.field__input}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Describe the topic or phrase you are looking for"
              />
            </div>
            <button
              type="submit"
              className={styles.actionBtn}
              disabled={searchLoading || !searchQuery.trim()}
            >
              {searchLoading ? (
                <Loader2 size={16} className={styles.spin} aria-hidden />
              ) : (
                <Search size={16} aria-hidden />
              )}
              Search
            </button>
            {searchError ? (
              <div className={styles.inlineError} role="alert">
                {searchError}
              </div>
            ) : null}
            {searchResults.length > 0 ? (
              <ul className={styles.searchResults} aria-label="Search results">
                {searchResults.map((result) => (
                  <li
                    key={
                      result.chunkId ?? `${result.chunkIndex}-${result.score}`
                    }
                    className={styles.searchResult}
                  >
                    <p className={styles.searchResult__meta}>
                      Score: {Number(result.score).toFixed(2)} · Chunk{" "}
                      {result.chunkIndex}
                    </p>
                    <p className={styles.searchResult__excerpt}>
                      {result.excerpt}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </form>
        </section>

        <section aria-labelledby="ask-title">
          <h2 id="ask-title" className={styles.section__title}>
            Ask with AI
          </h2>
          <p className={styles.section__subtitle}>
            Answers use only retrieved excerpts from this PDF, with citations
            when the model includes them.
          </p>
          <form onSubmit={handleAsk}>
            <div className={styles.field}>
              <label htmlFor="ask-query" className={styles.field__label}>
                Question
              </label>
              <textarea
                id="ask-query"
                className={styles.field__textarea}
                value={askQuery}
                onChange={(e) => setAskQuery(e.target.value)}
                placeholder="Ask a clear question in plain language..."
                rows={4}
              />
            </div>
            <button
              type="submit"
              className={styles.actionBtn}
              disabled={askLoading || !askQuery.trim()}
            >
              {askLoading ? (
                <Loader2 size={16} className={styles.spin} aria-hidden />
              ) : (
                <Sparkles size={16} aria-hidden />
              )}
              Ask
            </button>
            {askError ? (
              <div className={styles.inlineError} role="alert">
                {askError}
              </div>
            ) : null}
            {askAnswer ? (
              <div className={styles.answerBlock}>
                <RagAnswerBody>{askAnswer}</RagAnswerBody>
              </div>
            ) : null}
          </form>
        </section>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <section className={styles.header} aria-labelledby="rag-title">
        <p className={styles.header__eyebrow}>Knowledge base</p>
        <h1 id="rag-title" className={styles.header__title}>
          Private PDF library
        </h1>
        <p className={styles.header__description}>
          Upload study or reference PDFs to your own workspace. Each file is
          indexed for semantic search and optional AI answers that cite passages
          from that document only. File size limits apply on the server; other
          users never see your uploads.
        </p>
      </section>

      {listError ? (
        <div className={styles.listError} role="alert">
          {listError}
        </div>
      ) : null}

      <div className={styles.workspace}>
        <section className={styles.panel} aria-labelledby="library-title">
          <h2 id="library-title" className={styles.panel__title}>
            Library
          </h2>
          <p className={styles.panel__subtitle}>
            Add PDFs here. Processing runs once per upload.
          </p>

          <div className={styles.uploadZone}>
            <p className={styles.uploadZone__hint}>
              Accepted format: PDF. Maximum file size is enforced by the server.
            </p>
            <div className={styles.uploadZone__actions}>
              <input
                ref={fileInputRef}
                id="pdf-upload"
                type="file"
                accept="application/pdf,.pdf"
                className={styles.fileInput}
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <label htmlFor="pdf-upload" className={styles.chooseBtn}>
                <FileText size={16} aria-hidden />
                Choose file
              </label>
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={16} className={styles.spin} aria-hidden />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} aria-hidden />
                    Upload
                  </>
                )}
              </button>
            </div>
            <p className={styles.fileStatus}>
              {selectedFile ? (
                <>
                  <span className={styles.fileStatus__name}>
                    {selectedFile.name}
                  </span>
                  {formatBytes(selectedFile.size)
                    ? ` · ${formatBytes(selectedFile.size)}`
                    : ""}
                </>
              ) : (
                "No file selected."
              )}
            </p>
            {uploadError ? (
              <div className={styles.inlineError} role="alert">
                {uploadError}
              </div>
            ) : null}
          </div>

          {renderDocumentList()}
        </section>

        <section className={styles.panel} aria-live="polite">
          {renderRightColumn()}
        </section>
      </div>
    </div>
  );
}
