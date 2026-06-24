import { describe, expect, it, vi } from "vitest";
import {
  createConsoleLogger,
  createTaskTypeValueFunction,
  enforceBudget,
  planRequest,
  routeModel
} from "../src";

describe("tokenfly SDK stage 2", () => {
  it("exports routing decisions through the public SDK", () => {
    const result = routeModel({
      taskType: "code_generation",
      estimatedInputTokens: 4000,
      budgetLimit: 0.2,
      qualityPreference: "quality"
    });

    expect(result.selectedModel).toBe("gpt-4");
    expect(result.candidates.length).toBeGreaterThan(1);
    expect(result.reason).toContain("model");
  });

  it("supports structured budget enforcement through the public SDK", () => {
    const result = enforceBudget({
      taskType: "legal_review",
      budgetLimit: 0.01,
      estimatedCost: 0.02,
      selectedModel: "gpt-4",
      fallbackModel: "gpt-3.5-turbo",
      downgradeCandidates: [
        {
          model: "gpt-3.5-turbo",
          estimatedCost: 0.005
        }
      ]
    });

    expect(result.decision).toBe("recommend_downgrade");
    expect(result.finalModel).toBe("gpt-3.5-turbo");
    expect(result.logEntry.downgraded).toBe(true);
  });

  it("plans a request end to end and auto-downgrades when budget requires it", () => {
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };
    const result = planRequest({
      text: "Write a careful legal summary for this contract.",
      taskType: "legal_review",
      budgetLimit: 0.01,
      qualityPreference: "quality",
      estimatedOutputTokens: 200,
      logger,
      taskValueFunction: createTaskTypeValueFunction({
        legal_review: 0.95
      })
    });

    expect(result.route.selectedModel).toBe("gpt-4");
    expect(result.budget?.decision).toBe("recommend_downgrade");
    expect(result.finalModel).toBe("gpt-3.5-turbo");
    expect(result.downgraded).toBe(true);
    expect(logger.info).toHaveBeenCalled();
  });

  it("exposes a console logger helper for SDK callers", () => {
    const logger = createConsoleLogger();

    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
  });
});
