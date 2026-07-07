import { safeExecute } from '../../../../db/config.js';
import {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
} from '../../../../../backend/src/utils/errors/index.js';

/**
 * Maps a raw database row to a structured answer object.
 */
const mapAnswer = row => ({
  id: row.id,
  questionId: row.questionId,
  content: row.content,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  author: {
    id: row.userId,
    firstName: row.firstName,
    lastName: row.lastName,
  },
});

/**
 * Retrieves the owner of a specific question.
 */
const getQuestionOwner = async questionId => {
  const rows = await safeExecute(
    'SELECT question_id, user_id FROM questions WHERE question_id = ? LIMIT 1',
    [questionId],
  );

  if (rows.length === 0) {
    throw new NotFoundError('Question not found');
  }

  return rows[0];
};

/**
 * Retrieves ownership validation records for an answer block.
 */
const getAnswerOwner = async answerId => {
  const rows = await safeExecute(
    'SELECT answer_id, user_id FROM answers WHERE answer_id = ? LIMIT 1',
    [answerId],
  );

  if (rows.length === 0) {
    throw new NotFoundError('Answer not found');
  }

  return rows[0];
};

/**
 * Generates the SQL ORDER BY clause for answers based on the sort criteria.
 */
const getAnswerSortSql = sortBy => {
  if (sortBy === 'oldest') {
    return 'a.created_at ASC';
  }
  return 'a.created_at DESC';
};

/**
 * Retrieves a single answer by its ID.
 */
export const getSingleAnswerService = async answerId => {
  const sql = `
    SELECT
      a.answer_id AS id,
      a.question_id AS questionId,
      a.content,
      a.created_at AS createdAt,
      a.updated_at AS updatedAt,
      u.user_id AS userId,
      u.first_name AS firstName,
      u.last_name AS lastName
    FROM answers a
    JOIN users u ON u.user_id = a.user_id
    WHERE a.answer_id = ?
    LIMIT 1
  `;

  const rows = await safeExecute(sql, [answerId]);
  if (rows.length === 0) {
    throw new NotFoundError('Answer not found');
  }

  return mapAnswer(rows[0]);
};

/**
 * Retrieves all answers aligned with a specialized query parameter filter set.
 */
export const getAnswersService = async ({ questionId, sortBy }) => {
  const sortSql = getAnswerSortSql(sortBy);
  const sql = `
    SELECT
      a.answer_id AS id,
      a.question_id AS questionId,
      a.content,
      a.created_at AS createdAt,
      a.updated_at AS updatedAt,
      u.user_id AS userId,
      u.first_name AS firstName,
      u.last_name AS lastName
    FROM answers a
    JOIN users u ON u.user_id = a.user_id
    WHERE a.question_id = ?
    ORDER BY ${sortSql}
  `;

  const rows = await safeExecute(sql, [questionId]);
  return rows.map(row => mapAnswer(row));
};

/**
 * Creates a new answer for a specific question.
 */
export const createAnswerService = async ({ questionId, userId, content }) => {
  const question = await getQuestionOwner(questionId);
  if (question.user_id === userId) {
    throw new BadRequestError('You cannot answer your own question');
  }

  const insertSql =
    'INSERT INTO answers (question_id, user_id, content) VALUES (?, ?, ?)';
  const result = await safeExecute(insertSql, [questionId, userId, content]);

  return getSingleAnswerService(result.insertId);
};

/**
 * Updates an existing answer.
 */
export const updateAnswerService = async ({ answerId, userId, content }) => {
  const answer = await getAnswerOwner(answerId);
  if (answer.user_id !== userId) {
    throw new UnauthenticatedError(
      'You are not authorized to update this answer',
    );
  }

  await safeExecute(
    'UPDATE answers SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE answer_id = ?',
    [content, answerId],
  );

  return getSingleAnswerService(answerId);
};

/**
 * Deletes an existing answer (Completed part).
 */
export const deleteAnswerService = async ({ answerId, userId }) => {
  const answer = await getAnswerOwner(answerId);
  if (answer.user_id !== userId) {
    throw new UnauthenticatedError(
      'You are not authorized to delete this answer',
    );
  }

  await safeExecute('DELETE FROM answers WHERE answer_id = ?', [answerId]);

  return { answerId };
};