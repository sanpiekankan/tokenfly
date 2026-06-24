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
      fallbackModel: "gpt-3.5-turbo",
      downgradeCandidates: [
        {
          model: "gpt-3.5-turbo",
          estimatedCost: 0.005
        }
      ]
    });

    expect(result.allowed).toBe(true);
    expect(result.decision).toBe("recommend_downgrade");
    expect(result.recommendedModel).toBe("gpt-3.5-turbo");
    expect(result.finalModel).toBe("gpt-3.5-turbo");
    expect(result.downgraded).toBe(true);
    expect(result.finalCost).toBe(0.005);
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
        fallbackModel: "gpt-3.5-turbo",
        downgradeCandidates: [
          {
            model: "gpt-3.5-turbo",
            estimatedCost: 0.006
          }
        ]
      },
      {
        taskValueFunction
      }
    );

    expect(result.decision).toBe("recommend_downgrade");
    expect(result.taskValue.reason).toContain("custom business policy");
  });

  it("emits a structured budget log entry for callers to persist", () => {
    const result = enforceBudget({
      taskType: "classification",
      budgetLimit: 0.01,
      estimatedCost: 0.02,
      selectedModel: "gpt-4"
    });

    expect(result.logEntry.taskType).toBe("classification");
    expect(result.logEntry.blocked).toBe(true);
    expect(result.logEntry.estimatedCost).toBe(0.02);
  });
});
