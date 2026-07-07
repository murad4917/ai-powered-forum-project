import express from "express";
import {
  createQuestionController,
  generateQuestionDraftCoachController,
  assessAnswerAgainstQuestionController,
  getQuestionsController,
  searchQuestionsSemanticController,
  getSingleQuestionController,
  getSimilarQuestionsController,
  updateQuestionController,
  deleteQuestionController,
} from "../controller/questionController.js";
import {
  createQuestionValidation,
  generateQuestionDraftCoachValidation,
  assessAnswerAgainstQuestionValidation,
  getQuestionsValidation,
  searchQuestionsSemanticValidation,
  getSingleQuestionValidation,
  getSimilarQuestionsValidation,
  updateQuestionValidation,
  deleteQuestionValidation,
} from "../validations/question.validation.js";
import { authenticateUser } from "../../../middleware/authentication.js";

const router = express.Router();

router.post(
  "/",
  authenticateUser,
  createQuestionValidation,
  createQuestionController,
);

router.post(
  "/draft-coach",
  authenticateUser,
  generateQuestionDraftCoachValidation,
  generateQuestionDraftCoachController,
);
router.post(
  "/:questionHash/answer-fit",
  authenticateUser,
  assessAnswerAgainstQuestionValidation,
  assessAnswerAgainstQuestionController,
);


router.get(
  "/",
  authenticateUser,
  getQuestionsValidation,
  getQuestionsController,
);

router.get(
  "/search",
  authenticateUser,
  searchQuestionsSemanticValidation,
  searchQuestionsSemanticController,
);
router.put(
  "/:questionHash",
  authenticateUser,
  updateQuestionValidation,
  updateQuestionController,
);

router.delete(
  "/:questionHash",
  authenticateUser,
  deleteQuestionValidation,
  deleteQuestionController,
);

router.get(
  "/:questionHash",
  authenticateUser,
  getSingleQuestionValidation,
  getSingleQuestionController,
);

router.get(
  "/:questionHash/similar",
  authenticateUser,
  getSimilarQuestionsValidation,
  getSimilarQuestionsController,
);

export default router;
