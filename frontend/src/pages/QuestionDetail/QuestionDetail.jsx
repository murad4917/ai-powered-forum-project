/**
 * Question Detail: thread view, answers list, post answer, and AI answer-fit check.
 * Route: `/question/:questionHash`
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bold,
  Code2,
  Edit3,
  Italic,
  Link2,
  MessageSquare,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import RagAnswerBody from "../../components/RagAnswerBody/RagAnswerBody.jsx";
import { answerService } from "../../services/answer/answer.service.js";
import { questionService } from "../../services/question/question.service.js";
import { isAuthoredByUser } from "../../lib/utils.js";
import styles from "./QuestionDetail.module.css";

const ANSWER_MIN = 20;

function wrapSelection(textarea, before, after = before) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const selected = value.slice(start, end);
  const nextValue =
    value.slice(0, start) + before + selected + after + value.slice(end);

  return {
    nextValue,
    selectionStart: start + before.length,
    selectionEnd: end + before.length,
  };
}

function getAvatarUrl(author) {
  const firstName = author?.firstName || "User";
  const lastName = author?.lastName || "";
  return (
    author?.avatar ||
    `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`
  );
}

function getAuthorLabel(author, currentUser) {
  if (
    author?.id != null &&
    currentUser?.id != null &&
    String(author.id) === String(currentUser.id)
  ) {
    return "You";
  }
  const { firstName, lastName } = author ?? {};
  return [firstName, lastName].filter(Boolean).join(" ") || "Unknown";
}

function formatPostedDate(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

function getAnswerCountLabel(count) {
  if (count === 1) return "1 Answer";
  return `${count ?? 0} Answers`;
}

export default function QuestionDetail() {
  const { questionHash } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const answerRef = useRef(null);

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [relatedQuestions, setRelatedQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [answerText, setAnswerText] = useState("");
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fitResult, setFitResult] = useState(null);
  const [fitError, setFitError] = useState(null);
  const [isCheckingFit, setIsCheckingFit] = useState(false);

  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editedAnswerText, setEditedAnswerText] = useState("");
  const [pendingDeleteAnswerId, setPendingDeleteAnswerId] = useState(null);
  const [answerActionError, setAnswerActionError] = useState(null);
  const [isAnswerUpdating, setIsAnswerUpdating] = useState(false);
  const [isAnswerDeleting, setIsAnswerDeleting] = useState(false);

  const isOwnQuestion = question && isAuthoredByUser(question, user);
  const isBusy =
    isSubmitting || isCheckingFit || isAnswerUpdating || isAnswerDeleting;
  const answerLength = answerText.length;

  const loadQuestion = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [detail, similar] = await Promise.all([
        questionService.getSingleQuestion(questionHash),
        questionService.getSimilarQuestions(questionHash),
      ]);

      setQuestion(detail.question);
      setAnswers(detail.answers ?? []);
      setRelatedQuestions(similar);
    } catch {
      setLoadError("Failed to load question details.");
      setQuestion(null);
      setAnswers([]);
      setRelatedQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [questionHash]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const applyMarkdown = (format) => {
    const textarea = answerRef.current;
    if (!textarea) return;

    const wrappers = {
      bold: ["**", "**"],
      italic: ["*", "*"],
      code: ["`", "`"],
      link: ["[", "](url)"],
    };

    const [before, after] = wrappers[format];
    const { nextValue, selectionStart, selectionEnd } = wrapSelection(
      textarea,
      before,
      after,
    );

    setAnswerText(nextValue);
    setSubmitError(null);
    setFitResult(null);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: question?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* user cancelled or clipboard denied */
    }
  };

  const handleCheckFit = async () => {
    const trimmed = answerText.trim();

    if (trimmed.length < ANSWER_MIN) {
      setSubmitError(`You need at least ${ANSWER_MIN} characters.`);
      return;
    }

    setIsCheckingFit(true);
    setFitError(null);
    setFitResult(null);
    setSubmitError(null);

    try {
      const result = await questionService.assessAnswerFit(
        questionHash,
        trimmed,
      );
      setFitResult(result);
    } catch (err) {
      setFitError(err?.message || "Failed to check answer fit.");
    } finally {
      setIsCheckingFit(false);
    }
  };

  const startAnswerEdit = (answer) => {
    setEditingAnswerId(answer.id);
    setEditedAnswerText(answer.content);
    setPendingDeleteAnswerId(null);
    setAnswerActionError(null);
  };

  const cancelAnswerEdit = () => {
    setEditingAnswerId(null);
    setEditedAnswerText("");
    setAnswerActionError(null);
  };

  const startAnswerDelete = (answer) => {
    setPendingDeleteAnswerId(answer.id);
    setEditingAnswerId(null);
    setEditedAnswerText("");
    setAnswerActionError(null);
  };

  const cancelAnswerDelete = () => {
    setPendingDeleteAnswerId(null);
    setAnswerActionError(null);
  };

  const handleSaveAnswerEdit = async (event) => {
    event.preventDefault();
    if (!editingAnswerId) return;

    const trimmed = editedAnswerText.trim();
    if (trimmed.length < ANSWER_MIN) {
      setAnswerActionError(`Answer must be at least ${ANSWER_MIN} characters.`);
      return;
    }

    setIsAnswerUpdating(true);
    setAnswerActionError(null);

    try {
      const updated = await answerService.updateAnswer(
        editingAnswerId,
        trimmed,
      );
      setAnswers((prev) =>
        prev.map((answer) => (answer.id === updated.id ? updated : answer)),
      );
      cancelAnswerEdit();
    } catch (err) {
      setAnswerActionError(err.message || "Failed to update answer.");
    } finally {
      setIsAnswerUpdating(false);
    }
  };

  const handleConfirmAnswerDelete = async () => {
    if (!pendingDeleteAnswerId) return;

    setIsAnswerDeleting(true);
    setAnswerActionError(null);

    try {
      await answerService.deleteAnswer(pendingDeleteAnswerId);
      setAnswers((prev) =>
        prev.filter((answer) => answer.id !== pendingDeleteAnswerId),
      );
      setQuestion((prev) =>
        prev
          ? {
              ...prev,
              answerCount: Math.max(
                (prev.answerCount ?? answers.length) - 1,
                0,
              ),
            }
          : prev,
      );
      cancelAnswerDelete();
    } catch (err) {
      setAnswerActionError(err.message || "Failed to delete answer.");
    } finally {
      setIsAnswerDeleting(false);
    }
  };

  const handleSubmitAnswer = async (event) => {
    event.preventDefault();

    const trimmed = answerText.trim();
    if (trimmed.length < ANSWER_MIN) {
      setSubmitError(`You need at least ${ANSWER_MIN} characters.`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const newAnswer = await answerService.postAnswer(question.id, trimmed);
      setAnswers((prev) => [...prev, newAnswer]);
      setQuestion((prev) =>
        prev
          ? {
              ...prev,
              answerCount: (prev.answerCount ?? answers.length) + 1,
            }
          : prev,
      );
      setAnswerText("");
      setFitResult(null);
    } catch {
      setSubmitError("Failed to post answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.statePanel}>
        <p className={styles.statePanel__message}>
          Loading question details...
        </p>
      </div>
    );
  }

  if (loadError || !question) {
    return (
      <div className={styles.statePanel}>
        <p
          className={`${styles.statePanel__message} ${styles["statePanel__message--error"]}`}
          role="alert"
        >
          {loadError || "Failed to load question details."}
        </p>
        <button
          type="button"
          className={styles.statePanel__action}
          onClick={() => navigate("/dashboard")}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const answerCount = question.answerCount ?? answers.length;

  return (
    <div className={styles.page}>
      <button
        type="button"
        className={styles.backLink}
        onClick={() => navigate("/dashboard")}
      >
        <ArrowLeft size={16} aria-hidden />
        Back to feed
      </button>

      <div className={styles.layout}>
        <div className={styles.main}>
          <article className={styles.questionCard}>
            <header className={styles.questionCard__header}>
              <div className={styles.questionCard__avatar}>
                <img
                  src={getAvatarUrl(question.author)}
                  alt={getAuthorLabel(question.author, user)}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className={styles.questionCard__author}>
                  {getAuthorLabel(question.author, user)}
                </div>
                <div className={styles.questionCard__date}>
                  Posted {formatPostedDate(question.createdAt)}
                </div>
              </div>
            </header>

            <h1 className={styles.questionCard__title}>{question.title}</h1>

            <div className={styles.questionCard__body}>
              <RagAnswerBody>{question.content}</RagAnswerBody>
            </div>

            <div className={styles.questionCard__actions}>
              <button
                type="button"
                className={styles.metaButton}
                onClick={handleShare}
              >
                <Share2 size={14} aria-hidden />
                Share
              </button>
              <span className={styles.metaButton} aria-label="Answer count">
                <MessageSquare size={14} aria-hidden />
                {getAnswerCountLabel(answerCount)}
              </span>
            </div>
          </article>

          <section aria-labelledby="community-answers-title">
            <h2
              id="community-answers-title"
              className={styles.answersSection__title}
            >
              Community Answers ({answers.length})
            </h2>

            {answers.length === 0 ? (
              <div className={styles.emptyAnswers}>
                <MessageSquare
                  className={styles.emptyAnswers__icon}
                  size={22}
                  aria-hidden
                />
                <div>
                  <p className={styles.emptyAnswers__title}>
                    Be the first to help!
                  </p>
                  <p className={styles.emptyAnswers__text}>
                    This question is waiting for an expert like you. Share your
                    knowledge and earn reputation points.
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.answersList}>
                {answerActionError && (
                  <p className={styles.submitError} role="alert">
                    {answerActionError}
                  </p>
                )}
                {answers.map((answer) => {
                  const isOwnAnswer = isAuthoredByUser(answer, user);
                  const isEditingAnswer = editingAnswerId === answer.id;
                  const isDeletingAnswer = pendingDeleteAnswerId === answer.id;

                  return (
                    <article key={answer.id} className={styles.answerCard}>
                      <header className={styles.answerCard__header}>
                        <div className={styles.answerCard__avatar}>
                          <img
                            src={getAvatarUrl(answer.author)}
                            alt={getAuthorLabel(answer.author, user)}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <div className={styles.answerCard__author}>
                            {getAuthorLabel(answer.author, user)}
                          </div>
                          <div className={styles.answerCard__date}>
                            {formatPostedDate(answer.createdAt)}
                          </div>
                        </div>
                      </header>

                      {isEditingAnswer ? (
                        <form
                          className={styles.answerEditForm}
                          onSubmit={handleSaveAnswerEdit}
                        >
                          <textarea
                            className={styles.answerEditTextarea}
                            value={editedAnswerText}
                            onChange={(event) =>
                              setEditedAnswerText(event.target.value)
                            }
                            rows={6}
                            disabled={isAnswerUpdating}
                          />
                          <div className={styles.answerEditActions}>
                            <button
                              type="submit"
                              className={styles.saveButton}
                              disabled={isAnswerUpdating}
                            >
                              {isAnswerUpdating ? "Saving…" : "Save"}
                            </button>
                            <button
                              type="button"
                              className={styles.cancelButton}
                              onClick={cancelAnswerEdit}
                              disabled={isAnswerUpdating}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <RagAnswerBody>{answer.content}</RagAnswerBody>
                          {isOwnAnswer && (
                            <div className={styles.answerActions}>
                              <button
                                type="button"
                                className={`${styles.answerActionButton} ${styles.editButton}`}
                                onClick={() => startAnswerEdit(answer)}
                              >
                                <Edit3 size={14} aria-hidden />
                                Edit
                              </button>
                              <button
                                type="button"
                                className={`${styles.answerActionButton} ${styles.deleteButton}`}
                                onClick={() => startAnswerDelete(answer)}
                              >
                                <Trash2 size={14} aria-hidden />
                                Delete
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {isDeletingAnswer && (
                        <div className={styles.answerDeleteConfirm}>
                          <p>
                            Delete this answer? This action cannot be undone.
                          </p>
                          <div className={styles.answerDeleteActions}>
                            <button
                              type="button"
                              className={styles.deleteConfirmButton}
                              onClick={handleConfirmAnswerDelete}
                              disabled={isAnswerDeleting}
                            >
                              {isAnswerDeleting ? "Deleting…" : "Yes, delete"}
                            </button>
                            <button
                              type="button"
                              className={styles.cancelButton}
                              onClick={cancelAnswerDelete}
                              disabled={isAnswerDeleting}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {isOwnQuestion ? (
            <section className={styles.formSection}>
              <h2 className={styles.formSection__title}>
                Contribute an answer
              </h2>
              <p className={styles.ownQuestionNote}>
                You posted this question. Other learners can reply here — you
                cannot answer your own thread.
              </p>
            </section>
          ) : (
            <section className={styles.formSection}>
              <h2 className={styles.formSection__title}>
                Contribute an answer
              </h2>

              <form onSubmit={handleSubmitAnswer} noValidate>
                {submitError ? (
                  <p className={styles.submitError} role="alert">
                    {submitError}
                  </p>
                ) : null}

                <div className={styles.editor}>
                  <div className={styles.editor__toolbar}>
                    <div className={styles.editor__tools}>
                      <button
                        type="button"
                        className={styles.editor__tool}
                        onClick={() => applyMarkdown("bold")}
                        disabled={isBusy}
                        aria-label="Bold"
                        title="Bold"
                      >
                        <Bold size={16} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className={styles.editor__tool}
                        onClick={() => applyMarkdown("italic")}
                        disabled={isBusy}
                        aria-label="Italic"
                        title="Italic"
                      >
                        <Italic size={16} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className={styles.editor__tool}
                        onClick={() => applyMarkdown("code")}
                        disabled={isBusy}
                        aria-label="Code"
                        title="Code"
                      >
                        <Code2 size={16} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className={styles.editor__tool}
                        onClick={() => applyMarkdown("link")}
                        disabled={isBusy}
                        aria-label="Link"
                        title="Link"
                      >
                        <Link2 size={16} aria-hidden />
                      </button>
                    </div>
                    <span className={styles.editor__count}>
                      {answerLength} characters
                    </span>
                  </div>

                  <textarea
                    ref={answerRef}
                    className={styles.editor__textarea}
                    value={answerText}
                    onChange={(event) => {
                      setAnswerText(event.target.value);
                      setSubmitError(null);
                      setFitResult(null);
                    }}
                    placeholder="Type your answer here... You can use Markdown to format your code!"
                    disabled={isBusy}
                  />
                </div>

                <div className={styles.formFooter}>
                  <button
                    type="button"
                    className={styles.fitButton}
                    onClick={handleCheckFit}
                    disabled={isBusy}
                  >
                    <Sparkles size={16} aria-hidden />
                    {isCheckingFit ? "Checking..." : "Check draft fit"}
                  </button>
                  <span className={styles.formHint}>
                    Relevance only. Not grading correctness. You need at least{" "}
                    {ANSWER_MIN} characters.
                  </span>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isBusy}
                  >
                    {isSubmitting ? "Posting..." : "Post Your Answer"}
                  </button>
                </div>

                {fitError ? (
                  <p className={styles.submitError} role="alert">
                    {fitError}
                  </p>
                ) : null}

                {fitResult ? (
                  <div
                    className={`${styles.fitPanel} ${
                      styles[`fitPanel--${fitResult.level}`] || ""
                    }`}
                    role="status"
                  >
                    <p className={styles.fitPanel__level}>
                      Fit: {fitResult.level}
                    </p>
                    <p className={styles.fitPanel__note}>{fitResult.note}</p>
                  </div>
                ) : null}
              </form>
            </section>
          )}
        </div>

        {relatedQuestions.length > 0 ? (
          <aside className={styles.sidebar} aria-labelledby="related-title">
            <h2 id="related-title" className={styles.sidebar__title}>
              Related Questions
            </h2>
            <div className={styles.relatedList}>
              {relatedQuestions.map((related) => (
                <Link
                  key={related.questionHash ?? related.id}
                  to={`/question/${related.questionHash}`}
                  className={styles.relatedCard}
                >
                  <p className={styles.relatedCard__title}>{related.title}</p>
                  <p className={styles.relatedCard__meta}>
                    {[related.author?.firstName, related.author?.lastName]
                      .filter(Boolean)
                      .join(" ")}{" "}
                    · {formatPostedDate(related.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
