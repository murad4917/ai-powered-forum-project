import { StatusCodes } from "http-status-codes";
import {
  createQuestionService,
  getQuestionsService,
  getSingleQuestionService,
  searchQuestionsSemanticService,
  getSimilarQuestionsService,
  updateQuestionService,
  deleteQuestionService,
} from "../service/question.service.js";
import {
  generateQuestionDraftCoachService,
  assessAnswerAgainstQuestionService,
} from "../service/geminiTextCoach.service.js";

export const createQuestionController = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const data = await createQuestionService({
      userId: req.user.id,
      title,
      content,
    });
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Question posted successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;

    const result = await getSingleQuestionService({
      questionHash,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Question fetched successfully.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// export const getSingleQuestionController = async (req, res, next) => {
//   try {
//     const { questionHash } = req.params;
//     const result = await getSingleQuestionService({ questionHash });
//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: "Question fetched successfully.",
//       ...result,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// Handles AI coaching for a question draft (title+body).
export const generateQuestionDraftCoachController = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const data = await generateQuestionDraftCoachService({ title, content });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Draft suggestions generated.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getQuestionsController = async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search,
      mine: req.query.mine === "true" || req.query.mine === true,
      userId: req.user.id,
    };
    const result = await getQuestionsService(filters);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Questions retrieved successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    const { title, content } = req.body;
    const data = await updateQuestionService({
      questionHash,
      userId: req.user.id,
      title,
      content,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Question updated successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    const data = await deleteQuestionService({
      questionHash,
      userId: req.user.id,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Question deleted successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const searchQuestionsSemanticController = async (req, res, next) => {
  try {
    const result = await searchQuestionsSemanticService({
      query: req.query.query,
      k: req.query.k ? Number(req.query.k) : 5,
      threshold:
        req.query.threshold !== undefined
          ? Number(req.query.threshold)
          : undefined,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Semantic search completed successfully.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getSimilarQuestionsController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    const k = req.query.k ? Number(req.query.k) : undefined;
    const threshold =
      req.query.threshold !== undefined
        ? Number(req.query.threshold)
        : undefined;
    const result = await getSimilarQuestionsService({
      questionHash,
      k,
      threshold,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Similar questions fetched successfully.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles AI relevance assessment of an answer draft against a question.
 */
export const assessAnswerAgainstQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    const { answerText } = req.body;

    const { question } = await getSingleQuestionService({
      questionHash,
      includeAnswer: false,
    });

    const data = await assessAnswerAgainstQuestionService({
      questionTitle: question.title,
      questionContent: question.content,
      answerText,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Answer fit assessed.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
