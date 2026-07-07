import express from 'express';
import {
  createAnswerController,
  deleteAnswerController,
  getAnswersController,
  getSingleAnswerController,
  updateAnswerController,
} from '../controller/answer.controller.js';

import {
  answerIdValidation,
  createAnswerValidation,
  getAnswersValidation,
  updateAnswerValidation,
} from '../validation/answer.validation.js';
import { authenticateUser } from '../../../middleware/authentication.js';

const router = express.Router();

/**
 * @route POST /api/answers
 * @desc Post a new answer
 * @access Protected
 */
router.post(
  '/',
  authenticateUser,
  createAnswerValidation,
  createAnswerController,
);

/**
 * @route GET /api/answers
 * @desc Get answers for a question with pagination
 * @access Public
 */
router.get('/', getAnswersValidation, getAnswersController);

/**
 * @route GET /api/answers/:answerId
 * @desc Get a single answer by ID
 * @access Public
 */
router.get('/:answerId', answerIdValidation, getSingleAnswerController);

/**
 * @route PATCH /api/answers/:answerId
 * @desc Update one answer
 * @access Protected
 */
router.patch(
  '/:answerId',
  authenticateUser,
  updateAnswerValidation,
  updateAnswerController,
);

/**
 * @route DELETE /api/answers/:answerId
 * @desc Delete one answer
 * @access Protected
 */
router.delete(
  '/:answerId',
  authenticateUser,
  answerIdValidation,
  deleteAnswerController,
);

export default router;
