import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import {
  createQuestionController,
  getQuestionsController,
} from '../controller/question.controller.js';
import {
  createQuestionValidation,
  getQuestionsValidation,
} from '../validations/question.validation.js';

const router = express.Router();

/**
 * @route POST /api/questions
 * @desc Post a new question
 * @access Protected
 */
router.post('/',authenticateUser, createQuestionValidation, createQuestionController);

/**
 * @route GET /api/questions
 * @desc Get questions with optional search filtering
 * @access Private
 */
router.get('/', authenticateUser, getQuestionsValidation, getQuestionsController);

export default router;
