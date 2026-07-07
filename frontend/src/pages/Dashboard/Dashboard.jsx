/**
 * Dashboard: default home after login; question list, quick actions, URL-driven search.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  SquarePen, // Cleaner, modern "New Question" box icon
  Library, // Layered/Structured "Your Topics" icon
  BookOpen, // True textbook/library "Knowledge Base" icon
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { questionService } from "../../services/question/question.service";
import styles from "./Dashboard.module.css";

/* ── Helpers ──────────────────────────────────────────────────────────── */

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
const QUICKACTIONS = [
  {
    icon: SquarePen,
    title: "New question",
    desc: "Share context, errors, and what you already tried",
    to: "/questions/ask",
  },
  {
    icon: Library,
    title: "Your topics",
    desc: "Filtered list of threads you authored",
    to: "/my-questions",
  },
  {
    icon: BookOpen,
    title: "Knowledge base",
    desc: "Course library, uploads, and retrieval-backed context for threads",
    to: "/rag-documents",
  },
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

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();

  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const keywordQuery = searchParams.get("q") || "";
  const semanticQuery = searchParams.get("semantic") || "";
  const hasActiveSearch = Boolean(keywordQuery || semanticQuery);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let result;
      if (semanticQuery) {
        result = await questionService.searchQuestionsSemantic(semanticQuery);
      } else {
        result = await questionService.getQuestions({
          search: keywordQuery || undefined,
        });
      }
      setQuestions(result?.data || result || []);
    } catch (err) {
      setError(err.message || "Failed to load questions.");
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [keywordQuery, semanticQuery]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const stats = useMemo(() => {
    const currentUserId = user?.userId || user?.id;
    const totalQuestions = questions.length;
    const totalReplies = questions.reduce(
      (sum, q) => sum + (Number(q.answerCount) || 0),
      0,
    );
    const unanswered = questions.filter(
      (q) => (Number(q.answerCount) || 0) === 0,
    ).length;
    const yours = questions.filter(
      (q) => String(q.author?.id || q.userId) === String(currentUserId),
    ).length;

    return { totalQuestions, totalReplies, unanswered, yours };
  }, [questions, user]);

  const firstName = user?.firstName?.trim();
  const welcomeLine = firstName
    ? `Good to see you, ${firstName}.`
    : "Welcome to the forum.";

  return (
    <div className={styles.dashboard}>
      {/* Upper Information Card Module */}
      <section className={styles.heroCard}>
        <p className={styles.hero__label}>Forum Home</p>
        <h1 className={styles.hero__title}>{welcomeLine}</h1>
        <p className={styles.hero__subtitle}>
          Start a topic, revisit your own threads, or skim the live feed. Search
          above works from any page once you are back on Home.
        </p>

        <div className={styles.quickActionsGrid}>
          {QUICKACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className={styles.quickActionCard}
              id={`quick-action-${action.to.replace(/\//g, "-")}`}
            >
              <div className={styles.quickAction__iconBox}>
                <action.icon size={18} />
              </div>
              <div className={styles.quickAction__textBox}>
                <h4>{action.title}</h4>
                <p>{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <hr className={styles.divider} />

        {isLoading ? (
          <p className={styles.loadingSnapshotText}>
            Loading snapshot for the list below...
          </p>
        ) : (
          <p className={styles.statsIntro}>
            Figures below describe the newest threads in this feed (up to 100
            from the API).
          </p>
        )}

        <div className={styles.statsRowGrid}>
          <div className={styles.statCard}>
            <p className={styles.statCard__label}>Questions</p>
            <p className={styles.statCard__value}>
              {isLoading || error ? 0 : stats.totalQuestions}
            </p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statCard__label}>Replies</p>
            <p className={styles.statCard__value}>
              {isLoading || error ? 0 : stats.totalReplies}
            </p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statCard__label}>Unanswered</p>
            <p className={styles.statCard__value}>
              {isLoading || error ? 0 : stats.unanswered}
            </p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statCard__label}>Yours</p>
            <p className={styles.statCard__value}>
              {isLoading || error ? 0 : stats.yours}
            </p>
          </div>
        </div>
      </section>

      {/* Dynamic Discussion Live Stream Feed Container */}
      <section className={styles.feedCardContainer}>
        <div className={styles.feed__header}>
          <div className={styles.feed__headerLeft}>
            <h3>Discussion feed</h3>
            <p>
              {error
                ? "Your threads use a slim left accent in this list."
                : hasActiveSearch
                  ? `Showing ${semanticQuery ? "AI semantic" : "Keyword"} search results for “${semanticQuery || keywordQuery}”.`
                  : "Your threads use a slim left accent in this list."}
            </p>
          </div>
          <span className={styles.feed__badge}>Newest Threads</span>
        </div>

        <div className={styles.feedContentPanel}>
          {isLoading && (
            <div className={styles.loadingFeedWrapper} id="feed-loading">
              <p>Loading recent questions...</p>
            </div>
          )}

          {!isLoading && error && (
            <div
              className={styles.errorBoxWrapper}
              id="feed-error"
              role="alert"
            >
              <div className={styles.errorBoxInner}>
                Failed to load questions.
              </div>
            </div>
          )}

          {!isLoading && !error && questions.length === 0 && (
            <div className={styles.emptyBoxWrapper} id="feed-empty">
              <div className={styles.emptyBoxInner}>
                No questions found. Be the first to ask!
              </div>
            </div>
          )}

          {!isLoading && !error && questions.length > 0 && (
            <div className={styles.questionsStackList}>
              {questions.map((q) => {
                const authorName =
                  `${q.author?.firstName || ""} ${q.author?.lastName || ""}`.trim();
                const currentUserId = user?.userId || user?.id;
                const isMine =
                  String(q.author?.id || q.userId) === String(currentUserId);

                return (
                  <Link
                    key={q.questionHash || q.id}
                    to={`/question/${q.questionHash}`}
                    className={`${styles.questionCardItem} ${isMine ? styles["questionCardItem--mine"] : ""}`}
                    id={`question-${q.questionHash}`}
                  >
                    <div
                      className={styles.questionCard__avatar}
                      style={{ backgroundColor: getAvatarColor(authorName) }}
                    >
                      {getInitials(q.author?.firstName, q.author?.lastName)}
                    </div>

                    <div className={styles.questionCard__bodyBlock}>
                      <div className={styles.questionCard__titleFlexRow}>
                        <h4 className={styles.questionCard__titleText}>
                          {q.title}
                        </h4>
                        {isMine && (
                          <span className={styles.questionCard__yoursBadgeItem}>
                            Yours
                          </span>
                        )}
                      </div>

                      {q.content && (
                        <p className={styles.questionCard__excerptText}>
                          {q.content}
                        </p>
                      )}

                      <div className={styles.questionCard__metaRow}>
                        <MessageSquare
                          size={13}
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        <span>
                          {Number(q.answerCount) || 0} replies ·{" "}
                          {timeAgo(q.createdAt)} · by{" "}
                          {(authorName || "unknown").toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
