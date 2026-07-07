import { beforeEach, describe, expect, it, vi } from "vitest";
import { questionService } from "./question.service.js";
import { apiClient } from "../core/api.client.js";

vi.mock("../core/api.client.js", () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

describe("questionService question editing", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("updates a question through the API", async () => {
        apiClient.put.mockResolvedValue({
            data: { data: { questionHash: "abc123", title: "Updated", content: "Body" } },
        });

        const result = await questionService.updateQuestion("abc123", {
            title: "Updated",
            content: "Body",
        });

        expect(apiClient.put).toHaveBeenCalledWith("/api/questions/abc123", {
            title: "Updated",
            content: "Body",
        });
        expect(result.questionHash).toBe("abc123");
    });

    it("deletes a question through the API", async () => {
        apiClient.delete.mockResolvedValue({ data: { success: true } });

        await questionService.deleteQuestion("abc123");

        expect(apiClient.delete).toHaveBeenCalledWith("/api/questions/abc123");
    });
});
