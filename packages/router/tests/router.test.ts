import { describe, expect, it } from "vitest";
import { assessTaskComplexity, routeModel } from "../src";

describe("@tokenfly/router", () => {
  it("recommends a higher quality model for complex coding tasks", () => {
    const result = routeModel({
      taskType: "code_generation",
      estimatedInputTokens: 4000,
      budgetLimit: 0.2,
      qualityPreference: "quality"
    });

    expect(result.selectedModel).toBe("gpt-4");
    expect(result.complexity.level).toBe("high");
    expect(
      result.candidates[0]?.scoreDetails.some(
        (detail) => detail.rule === "weighted-score"
      )
    ).toBe(true);
  });

  it("prefers cheaper models when the budget is tight", () => {
    const result = routeModel({
      taskType: "classification",
      estimatedInputTokens: 1500,
      budgetLimit: 0.0015,
      qualityPreference: "speed"
    });

    expect(result.selectedModel).toBe("gpt-3.5-turbo");
    expect(result.candidates[0]?.estimatedCost).toBeLessThan(
      result.candidates[1]?.estimatedCost ?? Number.POSITIVE_INFINITY
    );
  });

  it("returns candidates sorted by descending total score", () => {
    const result = routeModel({
      taskType: "reasoning",
      estimatedInputTokens: 2000,
      qualityPreference: "balanced"
    });

    expect(result.candidates[0]?.totalScore).toBeGreaterThanOrEqual(
      result.candidates[1]?.totalScore ?? Number.NEGATIVE_INFINITY
    );
  });

  it("derives a stable complexity assessment from task type and token size", () => {
    const complexity = assessTaskComplexity({
      taskType: "summarization",
      estimatedInputTokens: 1200
    });

    expect(complexity.level).toBe("medium");
    expect(complexity.score).toBeGreaterThan(35);
    expect(complexity.reason).toContain("derived");
  });
});
