import { checkBudget } from "@tokenfly/core";
import type {
  BudgetDecision,
  BudgetDowngradeCandidate,
  BudgetEnforcementResult,
  BudgetLogEntry,
  BudgetOptions,
  BudgetRule,
  BudgetRuleInput,
  TaskValueAssessment,
  TaskValueFunction
} from "./types";

const DEFAULT_TASK_VALUE_SCORES: Record<string, number> = {
  classification: 0.35,
  extraction: 0.45,
  summarization: 0.55,
  translation: 0.55,
  reasoning: 0.8,
  code_generation: 0.9,
  legal_review: 0.95
};

function normalizeTaskType(taskType: string): string {
  return taskType.trim().toLowerCase().replace(/\s+/g, "_");
}

function clampValueScore(value: number): number {
  return Math.max(0, Math.min(value, 1));
}

function resolveAffordableDowngradeCandidate(
  input: BudgetRuleInput
): BudgetDowngradeCandidate | undefined {
  return input.downgradeCandidates?.find(
    (candidate) => candidate.estimatedCost <= input.budgetLimit
  );
}

function createBudgetLogEntry(
  input: BudgetRuleInput,
  decision: BudgetDecision,
  finalModel: string | undefined,
  finalCost: number,
  recommendedModel?: string
): BudgetLogEntry {
  return {
    taskType: input.taskType,
    budgetLimit: input.budgetLimit,
    estimatedCost: input.estimatedCost,
    finalCost,
    selectedModel: input.selectedModel,
    finalModel,
    recommendedModel,
    downgraded:
      Boolean(input.selectedModel) &&
      Boolean(finalModel) &&
      input.selectedModel !== finalModel,
    blocked: decision === "block",
    decision
  };
}

function logBudgetDecision(
  result: BudgetEnforcementResult,
  options: BudgetOptions
): void {
  if (!options.logger) {
    return;
  }

  const payload = {
    taskType: result.logEntry.taskType,
    budgetLimit: result.logEntry.budgetLimit,
    estimatedCost: result.logEntry.estimatedCost,
    finalCost: result.logEntry.finalCost,
    selectedModel: result.logEntry.selectedModel,
    finalModel: result.logEntry.finalModel,
    recommendedModel: result.logEntry.recommendedModel,
    downgraded: result.logEntry.downgraded,
    blocked: result.logEntry.blocked
  };

  if (result.decision === "block") {
    options.logger.warn("Budget strategy blocked a request.", payload);
    return;
  }

  if (result.decision === "recommend_downgrade") {
    options.logger.info("Budget strategy selected a downgrade path.", payload);
    return;
  }

  options.logger.debug("Budget strategy allowed a request.", payload);
}

function buildAllowResult(
  input: BudgetRuleInput,
  taskValue: TaskValueAssessment
): BudgetEnforcementResult {
  const budgetCheck = checkBudget({
    budgetLimit: input.budgetLimit,
    estimatedCost: input.estimatedCost,
    taskType: input.taskType,
    warningThreshold: input.warningThreshold
  });
  const finalModel = input.selectedModel;
  const logEntry = createBudgetLogEntry(
    input,
    "allow",
    finalModel,
    input.estimatedCost
  );

  return {
    allowed: true,
    decision: "allow",
    reason: budgetCheck.reason,
    estimatedCost: input.estimatedCost,
    finalCost: input.estimatedCost,
    finalModel,
    downgraded: false,
    taskValue,
    budgetCheck,
    evaluations: [],
    logEntry
  };
}

/**
 * Creates a task-value function that maps task types to configurable value scores.
 *
 * @param overrides - Optional per-task score or assessment overrides for value tuning.
 * @returns A task-value function that can be injected into budget rule evaluation.
 */
export function createTaskTypeValueFunction(
  overrides: Record<string, number | TaskValueAssessment> = {}
): TaskValueFunction {
  return (context) => {
    const normalizedTaskType = normalizeTaskType(context.taskType);
    const override = overrides[normalizedTaskType];

    if (typeof override === "number") {
      return {
        score: clampValueScore(override),
        reason: `Task value score for "${normalizedTaskType}" was provided by override.`
      };
    }

    if (override) {
      return {
        ...override,
        score: clampValueScore(override.score)
      };
    }

    const score = clampValueScore(
      DEFAULT_TASK_VALUE_SCORES[normalizedTaskType] ?? 0.5
    );

    return {
      score,
      reason: `Task value score ${score} was resolved from the default profile for "${normalizedTaskType}".`,
      recommendedBudget: Number((context.estimatedCost / Math.max(score, 0.1)).toFixed(6))
    };
  };
}

/**
 * Creates a rule that recommends model downgrade instead of a hard block for valuable tasks.
 *
 * @param minTaskValueScore - The minimum value score required before suggesting a downgrade path.
 * @returns A budget rule that emits a downgrade recommendation when budget is exceeded.
 */
export function createDowngradeBudgetRule(
  minTaskValueScore = 0.7
): BudgetRule {
  return {
    name: "recommend-downgrade",
    evaluate(context) {
      if (context.budgetCheck.status !== "block") {
        return {
          rule: "recommend-downgrade",
          triggered: false,
          decision: "allow",
          reason: "Estimated cost is already within the configured budget."
        };
      }

      const shouldRecommend =
        context.input.mode === "recommend_downgrade" ||
        context.taskValue.score >= minTaskValueScore;
      const affordableCandidate = resolveAffordableDowngradeCandidate(
        context.input
      );

      if (!shouldRecommend || !affordableCandidate) {
        return {
          rule: "recommend-downgrade",
          triggered: false,
          decision: "allow",
          reason: "No downgrade recommendation was produced for this budget violation."
        };
      }

      return {
        rule: "recommend-downgrade",
        triggered: true,
        decision: "recommend_downgrade",
        reason: `Estimated cost exceeds budget, but task value ${context.taskValue.score.toFixed(2)} justifies a downgrade recommendation.`,
        recommendedModel: affordableCandidate.model,
        recommendedCost: affordableCandidate.estimatedCost
      };
    }
  };
}

/**
 * Creates a rule that blocks requests once no budget-safe downgrade path is chosen.
 *
 * @returns A budget rule that emits a hard block for over-budget requests.
 */
export function createHardLimitBudgetRule(): BudgetRule {
  return {
    name: "hard-limit",
    evaluate(context) {
      if (context.budgetCheck.status !== "block") {
        return {
          rule: "hard-limit",
          triggered: false,
          decision: "allow",
          reason: "Budget remains within the configured hard limit."
        };
      }

      return {
        rule: "hard-limit",
        triggered: true,
        decision: "block",
        reason: `Estimated cost ${context.input.estimatedCost.toFixed(6)} exceeds hard budget limit ${context.input.budgetLimit.toFixed(6)}.`
      };
    }
  };
}

/**
 * Builds the default budget rule set for the first budget enforcement engine.
 *
 * @returns Ordered budget rules that prefer downgrade recommendations before hard blocking.
 */
export function createDefaultBudgetRules(): BudgetRule[] {
  return [createDowngradeBudgetRule(), createHardLimitBudgetRule()];
}

/**
 * Evaluates a request against configurable budget rules and optional downgrade logic.
 *
 * @param input - The task metadata, estimated cost, budget ceiling, and optional fallback model.
 * @param options - Optional task-value function and budget rule overrides.
 * @returns A structured budget enforcement decision with rule evaluations and downgrade hints.
 */
export function enforceBudget(
  input: BudgetRuleInput,
  options: BudgetOptions = {}
): BudgetEnforcementResult {
  const taskValueFunction =
    options.taskValueFunction ?? createTaskTypeValueFunction();
  const taskValue = taskValueFunction({
    taskType: input.taskType,
    estimatedCost: input.estimatedCost,
    budgetLimit: input.budgetLimit,
    selectedModel: input.selectedModel,
    fallbackModel: input.fallbackModel
  });
  const budgetCheck = checkBudget({
    budgetLimit: input.budgetLimit,
    estimatedCost: input.estimatedCost,
    taskType: input.taskType,
    warningThreshold: input.warningThreshold
  });

  if (budgetCheck.status !== "block") {
    const result = buildAllowResult(input, taskValue);
    logBudgetDecision(result, options);
    return result;
  }

  const rules = options.rules ?? createDefaultBudgetRules();
  const evaluations = rules.map((rule) =>
    rule.evaluate({
      input,
      budgetCheck,
      taskValue
    })
  );
  const finalEvaluation =
    evaluations.find((evaluation) => evaluation.triggered) ?? {
      rule: "fallback",
      triggered: true,
      decision: "block" as BudgetDecision,
      reason: budgetCheck.reason
    };
  const finalModel =
    finalEvaluation.decision === "recommend_downgrade"
      ? finalEvaluation.recommendedModel ?? input.selectedModel
      : input.selectedModel;
  const finalCost =
    finalEvaluation.decision === "recommend_downgrade"
      ? finalEvaluation.recommendedCost ?? input.estimatedCost
      : input.estimatedCost;
  const result: BudgetEnforcementResult = {
    allowed: finalEvaluation.decision !== "block",
    decision: finalEvaluation.decision,
    reason: finalEvaluation.reason,
    estimatedCost: input.estimatedCost,
    finalCost,
    recommendedModel: finalEvaluation.recommendedModel,
    finalModel,
    downgraded:
      Boolean(input.selectedModel) &&
      Boolean(finalModel) &&
      input.selectedModel !== finalModel,
    taskValue,
    budgetCheck,
    evaluations,
    logEntry: createBudgetLogEntry(
      input,
      finalEvaluation.decision,
      finalModel,
      finalCost,
      finalEvaluation.recommendedModel
    )
  };

  logBudgetDecision(result, options);

  return result;
}
