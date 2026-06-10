import { describe, expect, it } from "vitest";
import {
  checkBudget,
  estimateCost,
  estimateFileContentTokens,
  estimateTokens,
  getModelPricing
} from "../src";

describe("@tokenfly/core", () => {
  it("estimates tokens for plain text", () => {
    const result = estimateTokens("Hello world, this is a token test.");

    expect(result.model).toBe("gpt-4");
    expect(result.method).toBe("heuristic-v1");
    expect(result.tokenCount).toBeGreaterThan(0);
  });

  it("estimates tokens for file content", () => {
    const result = estimateFileContentTokens("# Title\n\nHello 世界");

    expect(result.tokenCount).toBeGreaterThan(0);
  });

  it("calculates total cost from pricing", () => {
    const cost = estimateCost({
      modelPricing: getModelPricing("gpt-4"),
      inputTokens: 1000,
      outputTokens: 500
    });

    expect(cost.inputCost).toBe(0.03);
    expect(cost.outputCost).toBe(0.03);
    expect(cost.totalCost).toBe(0.06);
  });

  it("blocks a request that exceeds the budget", () => {
    const budget = checkBudget({
      budgetLimit: 0.01,
      estimatedCost: 0.02
    });

    expect(budget.allowed).toBe(false);
    expect(budget.status).toBe("block");
  });
});
