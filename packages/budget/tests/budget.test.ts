import { describe, expect, it } from "vitest";
import { createTaskTypeValueFunction, enforceBudget } from "../src";

describe("@tokenfly/budget", () => {
  it("blocks low-value tasks that exceed the configured budget", () => {
    const result = enforceBudget({
      taskType: "classification",
      budgetLimit: 0.01,
      estimatedCost: 0.02,
      selectedModel: "gpt-4"
    });

    expect(result.allowed).toBe(false);
    expect(result.decision).toBe("block");
    expect(result.reason).toContain("exceeds hard budget limit");
  });

  it("recommends a downgrade for high-value tasks with a fallback model", () => {
    const result = enforceBudget({
      taskType: "legal_review",
      budgetLimit: 0.01,
      estimatedCost: 0.02,
      selectedModel: "gpt-4",
      fallbackModel: "gpt-3.5-turbo"
    });

    expect(result.allowed).toBe(true);
    expect(result.decision).toBe("recommend_downgrade");
    expect(result.recommendedModel).toBe("gpt-3.5-turbo");
  });

  it("supports injected task-value functions for custom downgrade policies", () => {
    const taskValueFunction = createTaskTypeValueFunction({
      classification: {
        score: 0.95,
        reason: "Classification was elevated by a custom business policy."
      }
    });
    const result = enforceBudget(
      {
        taskType: "classification",
        budgetLimit: 0.01,
        estimatedCost: 0.02,
        selectedModel: "gpt-4",
        fallbackModel: "gpt-3.5-turbo"
      },
      {
        taskValueFunction
      }
    );

    expect(result.decision).toBe("recommend_downgrade");
    expect(result.taskValue.reason).toContain("custom business policy");
  });
});
