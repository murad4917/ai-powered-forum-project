import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { MessageSquare } from 'lucide-react';
import { timeAgo, isAuthoredByUser } from '../../lib/utils.js';
import styles from './QuestionCard.module.css';

const PREVIEW_MAX_LENGTH = 320;

function truncateContent(content) {
  if (!content) return '';
  if (content.length <= PREVIEW_MAX_LENGTH) return content;
  return `${content.slice(0, PREVIEW_MAX_LENGTH).trimEnd()}…`;
}

function getAuthorLabel(question, currentUser) {
  if (isAuthoredByUser(question, currentUser)) return 'You';
  const { firstName, lastName } = question.author ?? {};
  return [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
}

function getAvatarUrl(author) {
  const firstName = author?.firstName || 'User';
  const lastName = author?.lastName || '';
  return (
    author?.avatar ||
    `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`
  );
}

/**
 * Shared question row used on Home and Your Topics.
 */
export default function QuestionCard({ question, currentUser, showYoursBadge = false }) {
  return (
    <Link
      to={`/question/${question.questionHash}`}
      className={styles.card}
    >
      <div className={styles.card__avatar}>
        <img
          src={getAvatarUrl(question.author)}
          alt={getAuthorLabel(question, currentUser)}
          referrerPolicy='no-referrer'
        />
      </div>

      <div className={styles.card__body}>
        <div className={styles.card__titleRow}>
          <h3 className={styles.card__title}>{question.title}</h3>
          {showYoursBadge ? (
            <span className={styles.card__badge}>Yours</span>
          ) : null}
        </div>

        {question.content ? (
          <div className={styles.card__preview}>
            <ReactMarkdown>
              {truncateContent(question.content)}
            </ReactMarkdown>
          </div>
        ) : null}

        <div className={styles.card__meta}>
          <MessageSquare size={13} strokeWidth={1.75} aria-hidden />
          <span>
            {question.answerCount ?? 0} replies · {timeAgo(question.createdAt)} · by{' '}
            {getAuthorLabel(question, currentUser).toLowerCase()}
          </span>
        </div>
      </div>
    </Link>
  );
}
