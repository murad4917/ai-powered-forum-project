/**
 * MyQuestions: Displays only the questions authored by the currently authenticated user.
 * Integrates with `questionService.getQuestions({ mine: true })`.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Bold,
  Italic,
  Code2,
  Link2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { questionService } from "../../services/question/question.service";
import styles from "./MyQuestions.module.css";
import postStyles from "../PostQuestion/PostQuestion.module.css";

/* ── Helpers ──────────────────────────────────────────────────────────── */

/** Deterministic palette matching Dashboard.jsx */
const AVATAR_COLORS = [
  "#f97316",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
];

function getAvatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(firstName = "", lastName = "") {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  const intervals = [
    { label: "year", secs: 31536000 },
    { label: "month", secs: 2592000 },
    { label: "week", secs: 604800 },
    { label: "day", secs: 86400 },
    { label: "hour", secs: 3600 },
    { label: "minute", secs: 60 },
  ];
  for (const { label, secs } of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count !== 1 ? "s" : ""} ago`;
  }
  return "just now";
}

/* ── Component ────────────────────────────────────────────────────────── */

export default function MyQuestions() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [pendingDeleteQuestion, setPendingDeleteQuestion] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function fetchMyQuestions() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await questionService.getQuestions({ mine: true });
      setQuestions(result?.data || result || []);
    } catch (err) {
      setError(err.message || "Failed to fetch questions.");
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchMyQuestions();
  }, []);

  const startEditing = (question) => {
    setEditingQuestion(question);
    setDraftTitle(question.title || "");
    setDraftContent(question.content || "");
    setPendingDeleteQuestion(null);
    setActionError(null);
  };

  const cancelEditing = () => {
    setEditingQuestion(null);
    setDraftTitle("");
    setDraftContent("");
    setActionError(null);
  };

  const initiateDelete = (question) => {
    setPendingDeleteQuestion(question);
    setEditingQuestion(null);
    setDraftTitle("");
    setDraftContent("");
    setActionError(null);
  };

  const cancelDelete = () => {
    setPendingDeleteQuestion(null);
    setActionError(null);
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    if (!editingQuestion) return;

    setIsSaving(true);
    setActionError(null);

    try {
      await questionService.updateQuestion(
        editingQuestion.questionHash || editingQuestion.id,
        {
          title: draftTitle.trim(),
          content: draftContent.trim(),
        },
      );
      await fetchMyQuestions();
      cancelEditing();
    } catch (err) {
      setActionError(err.message || "Failed to update question.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteQuestion) return;

    setIsDeleting(true);
    setActionError(null);

    try {
      await questionService.deleteQuestion(
        pendingDeleteQuestion.questionHash || pendingDeleteQuestion.id,
      );
      await fetchMyQuestions();
      setPendingDeleteQuestion(null);
    } catch (err) {
      setActionError(err.message || "Failed to delete question.");
    } finally {
      setIsDeleting(false);
    }
  };

  const userFullName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  const avatarInitials = getInitials(user?.firstName, user?.lastName);
  const avatarBgColor = getAvatarColor(userFullName);

  return (
    <div className={styles.container}>
      {/* Workspace Header Card */}
      <section className={styles.headerCard}>
        <div className={styles.headerCard__content}>
          <p className={styles.headerCard__label}>Your workspace</p>
          <h1 className={styles.headerCard__title}>Your topics</h1>
          <p className={styles.headerCard__subtitle}>
            Only questions you created. Open one to read answers or add
            follow-ups. Rows use the same left accent as your threads on Home.
          </p>
        </div>
        <Link
          to="/questions/ask"
          className={styles.newQuestionBtn}
          id="new-question-workspace-btn"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>New question</span>
        </Link>
      </section>

      {/* Main Content Area */}
      {isLoading && (
        <div className={styles.stateWrapper} id="my-questions-loading">
          <p className={styles.loadingText}>Loading your questions...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className={styles.stateWrapper} id="my-questions-error">
          <div className={styles.errorBox} role="alert">
            {error}
          </div>
        </div>
      )}

      {!isLoading && !error && questions.length === 0 && (
        <div className={styles.stateWrapper} id="my-questions-empty">
          <div className={styles.emptyBox}>
            <p className={styles.emptyText}>
              You have not asked any questions yet. Use Ask a Question in the
              sidebar to start.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && questions.length > 0 && (
        <section className={styles.questionsList} id="my-questions-feed">
          {actionError && (
            <div className={postStyles.submitError} role="alert">
              {actionError}
            </div>
          )}

          {editingQuestion && (
            <section className={postStyles.formCard}>
              <div className={postStyles.field}>
                <label className={postStyles.field__label} htmlFor="edit-title">
                  Title
                </label>
                <p className={postStyles.field__hint}>
                  Be specific and imagine you're asking a question to another
                  person.
                </p>
                <input
                  id="edit-title"
                  className={postStyles.field__input}
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  placeholder="e.g. How do I handle state management using Context API in React?"
                  required
                />
              </div>

              <div className={postStyles.field}>
                <label
                  className={postStyles.field__label}
                  htmlFor="edit-content"
                >
                  What are the details of your problem?
                </label>
                <p className={postStyles.field__hint}>
                  Introduce the problem and expand on what you put in the title.
                  Minimum 10 characters.
                </p>
                <div className={postStyles.editor}>
                  <div className={postStyles.editor__toolbar}>
                    <div className={postStyles.editor__tools}>
                      <button
                        type="button"
                        className={postStyles.editor__tool}
                        onClick={() => {}}
                      >
                        <Bold size={16} />
                      </button>
                      <button
                        type="button"
                        className={postStyles.editor__tool}
                        onClick={() => {}}
                      >
                        <Italic size={16} />
                      </button>
                      <button
                        type="button"
                        className={postStyles.editor__tool}
                        onClick={() => {}}
                      >
                        <Code2 size={16} />
                      </button>
                      <button
                        type="button"
                        className={postStyles.editor__tool}
                        onClick={() => {}}
                      >
                        <Link2 size={16} />
                      </button>
                    </div>
                    <span className={postStyles.editor__count}>
                      {draftContent.length} characters
                    </span>
                  </div>
                  <textarea
                    id="edit-content"
                    className={postStyles.editor__textarea}
                    value={draftContent}
                    onChange={(event) => setDraftContent(event.target.value)}
                    rows={10}
                    placeholder="Include all the information someone would need to answer your question... You can use Markdown to format your code!"
                    required
                  />
                </div>
              </div>

              <div className={postStyles.aiRow}>
                <button
                  type="button"
                  className={styles.saveButton}
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={cancelEditing}
                >
                  Cancel
                </button>
              </div>
            </section>
          )}

          {pendingDeleteQuestion && (
            <section className={`${postStyles.formCard} ${styles.confirmCard}`}>
              <h2 className={styles.confirmTitle}>Confirm delete</h2>
              <p className={styles.confirmText}>
                Are you sure you want to remove the question "
                {pendingDeleteQuestion.title}"? This action cannot be undone.
              </p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.deleteConfirmButton}
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting…" : "Yes, delete it"}
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={cancelDelete}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
              </div>
            </section>
          )}

          {questions.map((q) => {
            return (
              <div
                key={q.questionHash || q.id}
                className={styles.questionCard}
                id={`my-question-${q.questionHash}`}
              >
                <Link
                  to={`/question/${q.questionHash}`}
                  className={styles.questionCard__link}
                >
                  <div
                    className={styles.questionCard__avatar}
                    style={{ backgroundColor: avatarBgColor }}
                  >
                    {avatarInitials}
                  </div>

                  <div className={styles.questionCard__body}>
                    <div className={styles.questionCard__titleRow}>
                      <h4 className={styles.questionCard__title}>{q.title}</h4>
                      <span className={styles.questionCard__yoursBadge}>
                        Yours
                      </span>
                    </div>

                    {q.content && (
                      <p className={styles.questionCard__excerpt}>
                        {q.content}
                      </p>
                    )}

                    <div className={styles.questionCard__meta}>
                      <MessageSquare size={13} strokeWidth={1.75} aria-hidden />
                      <span>
                        {Number(q.answerCount) || 0} replies ·{" "}
                        {timeAgo(q.createdAt)} · by you
                      </span>
                    </div>
                  </div>
                </Link>

                <div className={styles.questionCard__actions}>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.iconButtonPrimary}`}
                    onClick={() => startEditing(q)}
                    aria-label={`Edit ${q.title}`}
                  >
                    <Pencil size={15} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                    onClick={() => initiateDelete(q)}
                    aria-label={`Delete ${q.title}`}
                    disabled={isDeleting}
                  >
                    <Trash2 size={15} />
                    <span>{isDeleting ? "Deleting…" : "Delete"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
