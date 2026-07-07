/**
 * Formats a date into a relative time string (e.g., "5 mins ago", "2 hrs ago")
 * @param {Date|string|number} dateInput - The date to format
 * @returns {string} Relative time string
 */
export function timeAgo(dateInput) {
  if (!dateInput) return '';

  const date = new Date(dateInput);

  // Check for invalid dates
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Handle future dates or extremely recent dates
  if (seconds < 0) return 'just now';
  if (seconds < 60) return `${seconds} sec${seconds !== 1 ? 's' : ''} ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours !== 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;

  const years = Math.floor(days / 365);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

/**
 * Whether a question was created by the signed-in user (IDs compared as strings).
 * @param {{ author?: { id?: string | number } } | null | undefined} question
 * @param {{ id?: string | number } | null | undefined} user
 * @returns {boolean}
 */
export function isAuthoredByUser(question, user) {
  if (!question || !user) return false;
  const authorId = question.author?.id;
  const userId = user.id;
  if (authorId == null || userId == null) return false;
  return String(authorId) === String(userId);
}
