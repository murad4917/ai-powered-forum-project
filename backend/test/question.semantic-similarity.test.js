import test from "node:test";
import assert from "node:assert/strict";

import { shouldBlockSimilarQuestion } from "../src/api/question/service/question.service.js";

test("blocks creation when semantic similarity meets the threshold", () => {
    const shouldBlock = shouldBlockSimilarQuestion({
        similarQuestions: [{ score: 0.81 }],
        threshold: 0.75,
    });

    assert.equal(shouldBlock, true);
});

test("allows creation when semantic similarity is below the threshold", () => {
    const shouldBlock = shouldBlockSimilarQuestion({
        similarQuestions: [{ score: 0.6 }],
        threshold: 0.75,
    });

    assert.equal(shouldBlock, false);
});
