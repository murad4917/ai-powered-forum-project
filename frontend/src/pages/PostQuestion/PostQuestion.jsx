/**
 * Post Question: create a new forum thread with optional AI draft coach.
 * Route: `/questions/ask`
 */

import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bold,
  Check,
  Code2,
  Italic,
  Link2,
  Send,
  Sparkles,
} from "lucide-react";
import { questionService } from "../../services/question/question.service.js";
import styles from "./PostQuestion.module.css";

const TITLE_MIN = 5;
const TITLE_MAX = 255;
const CONTENT_MIN = 10;

const INITIAL_FORM = {
  title: "",
  content: "",
};

function validateForm({ title, content }) {
  const errors = {};
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  if (trimmedTitle.length < TITLE_MIN) {
    errors.title = `Question title must be at least ${TITLE_MIN} characters`;
  } else if (trimmedTitle.length > TITLE_MAX) {
    errors.title = `Question title cannot exceed ${TITLE_MAX} characters`;
  }

  if (trimmedContent.length < CONTENT_MIN) {
    errors.content = `Question content must be at least ${CONTENT_MIN} characters`;
  }

  return errors;
}

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

export default function PostQuestion() {
  const navigate = useNavigate();
  const contentRef = useRef(null);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCoaching, setIsCoaching] = useState(false);
  const [coachTips, setCoachTips] = useState(null);
  const [coachError, setCoachError] = useState(null);
  const [publishedQuestion, setPublishedQuestion] = useState(null);

  const contentLength = formData.content.length;
  const isBusy = isSubmitting || isCoaching;

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError(null);
  };

  const applyMarkdown = (format) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    // const wrappers = {
    //   bold: ["**", "**"], // Standard Markdown bold
    //   italic: ["*", "*"], // Standard Markdown italics
    //   code: ["`", "`"], // Standard Markdown inline code
    //   link: ["[", "](url)"], // Standard Markdown link
    // };

    //     const wrappers = {
    // const wrappers = {
    //   bold: ["**", "**"], // Standard Markdown bold
    //   italic: ["*", "*"], // Standard Markdown italics
    //   code: ["`", "`"], // Standard Markdown inline code
    //   link: ["[", "](url)"], // Standard Markdown link
    // };

    const wrappers = {
      bold: ["**", "**"],
      italic: ["*", "*"],
      code: ["\n```\n", "\n```\n"],
      link: ["[", "](url)"],
    };

    const [before, after] = wrappers[format];
    const { nextValue, selectionStart, selectionEnd } = wrapSelection(
      textarea,
      before,
      after,
    );

    updateField("content", nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const handleCoach = async () => {
    const trimmedContent = formData.content.trim();

    if (trimmedContent.length < CONTENT_MIN) {
      setFieldErrors((prev) => ({
        ...prev,
        content: `Question content must be at least ${CONTENT_MIN} characters`,
      }));
      return;
    }

    setIsCoaching(true);
    setCoachError(null);
    setCoachTips(null);

    try {
      const tips = await questionService.generateQuestionDraftCoach({
        title: formData.title.trim(),
        content: trimmedContent,
      });
      setCoachTips(tips);
    } catch (err) {
      setCoachError(err?.message || "Failed to load AI suggestions.");
    } finally {
      setIsCoaching(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const data = await questionService.createQuestion({
        title: formData.title.trim(),
        content: formData.content.trim(),
      });
      setPublishedQuestion(data);
    } catch (err) {
      setSubmitError(
        err?.message || "Failed to post question. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAskAnother = () => {
    setFormData(INITIAL_FORM);
    setFieldErrors({});
    setSubmitError(null);
    setCoachTips(null);
    setCoachError(null);
    setPublishedQuestion(null);
  };

  if (publishedQuestion) {
    const questionHash =
      publishedQuestion.questionHash ?? publishedQuestion.id ?? "";

    return (
      <div className={styles.page}>
        <section
          className={styles.header}
          aria-labelledby="post-question-title"
        >
          <p className={styles.header__eyebrow}>Ask the cohort</p>
          <h1 id="post-question-title" className={styles.header__title}>
            Publish to the forum
          </h1>
          <p className={styles.header__description}>
            Public threads help the whole cohort. Write as if a classmate will
            debug your issue tomorrow. They only know what you put on the page.
          </p>
        </section>

        <section className={styles.successCard} aria-live="polite">
          <div className={styles.successCard__icon} aria-hidden>
            <Check size={28} strokeWidth={2.5} />
          </div>
          <h2 className={styles.successCard__title}>Thread published</h2>
          <p className={styles.successCard__message}>
            Your post is indexed for keyword search and embedding-based
            similarity. Share the link in study groups, or stay on the thread to
            answer follow-up questions from peers.
          </p>
          <div className={styles.successCard__actions}>
            <button
              type="button"
              className={styles.successCard__link}
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </button>
            <button
              type="button"
              className={styles.successCard__primary}
              onClick={() => navigate(`/question/${questionHash}`)}
            >
              View Question
            </button>
            <button
              type="button"
              className={styles.successCard__secondary}
              onClick={handleAskAnother}
            >
              Ask Another
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.header} aria-labelledby="post-question-title">
        <p className={styles.header__eyebrow}>Ask the cohort</p>
        <h1 id="post-question-title" className={styles.header__title}>
          Publish to the forum
        </h1>
        <p className={styles.header__description}>
          Public threads help the whole cohort. Write as if a classmate will
          debug your issue tomorrow. They only know what you put on the page.
        </p>
      </section>

      <section className={styles.guide} aria-label="Posting guidance">
        <h2 className={styles.guide__title}>
          Write questions people can answer in one pass
        </h2>
        <p className={styles.guide__intro}>
          Mentors volunteer their time. Give them runnable context, expected vs
          actual behavior, and a tight scope so they can reproduce the issue
          without guessing your setup.
        </p>

        <div className={styles.guide__columns}>
          <div>
            <h3 className={styles.guide__sectionTitle}>
              Checklist before you post
            </h3>
            <ul className={styles.guide__list}>
              <li>Clear title that states the bug or goal</li>
              <li>Repro steps: what you clicked, what you expected</li>
              <li>Minimal code blocks with language tags</li>
              <li>Exact error messages or screenshots described in text</li>
            </ul>
          </div>

          <div>
            <h3 className={styles.guide__sectionTitle}>
              Validation rules (enforced by the form)
            </h3>
            <ul className={styles.guide__list}>
              <li>Title length: 5 to 255 characters</li>
              <li>Body length: minimum 10 characters</li>
              <li>
                Single topic: split unrelated bugs into separate threads from
                horizontal to vertical list
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.formCard}>
        <form onSubmit={handleSubmit} noValidate>
          {submitError ? (
            <div className={styles.submitError} role="alert">
              {submitError}
            </div>
          ) : null}

          <div className={styles.field}>
            <label className={styles.field__label} htmlFor="question-title">
              Title
            </label>
            <p className={styles.field__hint}>
              Be specific and imagine you&apos;re asking a question to another
              person.
            </p>
            <input
              id="question-title"
              type="text"
              className={`${styles.field__input} ${
                fieldErrors.title ? styles["field__input--error"] : ""
              }`}
              value={formData.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="e.g. How do I handle state management using Context API in React?"
              disabled={isBusy}
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={
                fieldErrors.title ? "question-title-error" : undefined
              }
            />
            {fieldErrors.title ? (
              <p
                id="question-title-error"
                className={styles.field__error}
                role="alert"
              >
                {fieldErrors.title}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label className={styles.field__label} htmlFor="question-content">
              What are the details of your problem?
            </label>
            <p className={styles.field__hint}>
              Introduce the problem and expand on what you put in the title.
              Minimum {CONTENT_MIN} characters.
            </p>

            <div
              className={`${styles.editor} ${
                fieldErrors.content ? styles["editor--error"] : ""
              }`}
            >
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
                  {contentLength} characters
                </span>
              </div>

              <textarea
                id="question-content"
                ref={contentRef}
                className={styles.editor__textarea}
                value={formData.content}
                onChange={(event) => updateField("content", event.target.value)}
                placeholder="Include all the information someone would need to answer your question... You can use Markdown to format your code!"
                disabled={isBusy}
                aria-invalid={Boolean(fieldErrors.content)}
                aria-describedby={
                  fieldErrors.content ? "question-content-error" : undefined
                }
              />
            </div>

            {fieldErrors.content ? (
              <p
                id="question-content-error"
                className={styles.field__error}
                role="alert"
              >
                {fieldErrors.content}
              </p>
            ) : null}

            <div className={styles.aiRow}>
              <button
                type="button"
                className={styles.aiButton}
                onClick={handleCoach}
                disabled={isBusy}
              >
                <Sparkles size={16} aria-hidden />
                {isCoaching ? "Loading suggestions..." : "AI suggestions"}
              </button>
              <span className={styles.aiHint}>
                Suggestions only. You still choose what to post.
              </span>
            </div>

            {coachError ? (
              <div className={styles.coachPanel} role="alert">
                <p className={styles.coachPanel__error}>{coachError}</p>
              </div>
            ) : null}

            {coachTips?.length ? (
              <div className={styles.coachPanel}>
                <h3 className={styles.coachPanel__title}>AI draft coach</h3>
                <ul className={styles.coachPanel__list}>
                  {coachTips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelLink}
              onClick={() => navigate("/dashboard")}
              disabled={isBusy}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isBusy}
            >
              <Send size={16} aria-hidden />
              {isSubmitting ? "Posting..." : "Post Question"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
