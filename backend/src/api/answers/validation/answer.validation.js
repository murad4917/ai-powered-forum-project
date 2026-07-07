import { body, param, query } from 'express-validator';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';


export const createAnswerValidation = [
  body('questionId')  
    .notEmpty()
    .withMessage('Question id is required')
    .isInt({ min: 1 })
    .withMessage('Question id must be a positive integer')
    .toInt(),
  body('content')
    .notEmpty()
    .withMessage('Answer content is required')
    .isString()
    .withMessage('Answer content must be a string')
    .isLength({ min: 20 })
    .withMessage('Answer content must be at least 20 characters')
    .trim(),
  validationErrorHandler,
];

export const getAnswersValidation = [
  query('questionId')
    .notEmpty()
    .withMessage('questionId is required')
    .isInt({ min: 1 })
    .withMessage('questionId must be a positive integer')
    .toInt(),
  query('sortBy')
    .optional()
    .isIn(['newest', 'oldest'])
    .withMessage('sortBy must be one of newest, oldest'),
  validationErrorHandler,
];

export const answerIdValidation = [
  param('answerId')
    .isInt({ min: 1 })
    .withMessage('Answer id must be a positive integer')
    .toInt(),
  validationErrorHandler,
];

export const updateAnswerValidation = [
  param('answerId')
    .isInt({ min: 1 })
    .withMessage('Answer id must be a positive integer')
    .toInt(),
  body('content')
    .notEmpty()
    .withMessage('Answer content is required')
    .isString()
    .withMessage('Answer content must be a string')
    .isLength({ min: 20 })
    .withMessage('Answer content must be at least 20 characters')
    .trim(),
  validationErrorHandler,
];