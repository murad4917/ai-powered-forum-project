import { validationResult } from 'express-validator';
import { BadRequestError } from '../utils/errors/index.js';

export const validationErrorHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    throw new BadRequestError(errorMessages.join('. '));
  }
  next();
};
