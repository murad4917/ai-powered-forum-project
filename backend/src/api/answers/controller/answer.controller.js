import { StatusCodes } from 'http-status-codes';
import {
  createAnswerService,
  deleteAnswerService,
  getAnswersService,
  getSingleAnswerService,
  updateAnswerService,
} from '../service/answer.service.js';

/**
 * Handles creating a new answer.
 */
export const createAnswerController = async (req, res, next) => {
  try {
    const { questionId, content } = req.body;
    const answer = await createAnswerService({
      questionId,
      content,
      userId: req.user.id,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Answer posted successfully.',
      data: answer,
    });
  } catch (error) {
    next(error);
  }
};

/*****
 * Handles retrieving matching answers via standard queries.
 */
export const getAnswersController = async (req, res, next) => {
  try {
    const { questionId, sortBy } = req.query;
    const answers = await getAnswersService({ questionId, sortBy });

    res.status(StatusCodes.OK).json({
      success: true,
      data: answers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles retrieving an exact answer resource.
 */
export const getSingleAnswerController = async (req, res, next) => {
  try {
    const { answerId } = req.params;
    const answer = await getSingleAnswerService(answerId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: answer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles updates to target answer resource data structures.
 */
export const updateAnswerController = async (req, res, next) => {
  try {
    const { answerId } = req.params;
    const { content } = req.body;
    const updatedAnswer = await updateAnswerService({
      answerId,
      userId: req.user.id,
      content,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Answer updated successfully.',
      data: updatedAnswer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles stripping an individual answer record clean from table spaces.
 */
export const deleteAnswerController = async (req, res, next) => {
  try {
    const { answerId } = req.params;
    const deletedResult = await deleteAnswerService({
      answerId,
      userId: req.user.id,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Answer deleted successfully.',
      data: deletedResult,
    });
  } catch (error) {
    next(error);
  }
};