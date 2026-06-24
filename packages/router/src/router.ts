import {
  DEFAULT_MODEL_PRICING,
  estimateCost,
  type ModelPricing
} from "@tokenfly/core";
import { TokenflyError } from "@tokenfly/shared";
import type {
  ModelCapabilityProfile,
  RouterCandidate,
  RouterInput,
  RouterOptions,
  RouterResult,
  RouterScoreWeights,
  RoutingRule,
  RoutingRuleContext,
  TaskComplexityAssessment
} from "./types";

const DEFAULT_MODEL_CAPABILITIES: Record<string, ModelCapabilityProfile> = {
  "gpt-4": {
    model: "gpt-4",
    qualityTier: 5,
    speedTier: 2,
    costTier: 1,
    latencyMs: 1800,
    maxRecommendedInputTokens: 8192
  },
  "gpt-3.5-turbo": {
    model: "gpt-3.5-turbo",
    qualityTier: 3,
    speedTier: 5,
    costTier: 5,
    latencyMs: 700,
    maxRecommendedInputTokens: 16385
  }
};

const DEFAULT_SCORE_WEIGHTS: RouterScoreWeights = {
  cost: 1,
  quality: 1,
  latency: 1,
  taskType: 1,
  complexity: 1
};

const TASK_TYPE_MODEL_PREFERENCES: Record<string, string[]> = {
  classification: ["gpt-3.5-turbo", "gpt-4"],
  extraction: ["gpt-3.5-turbo", "gpt-4"],
  summarization: ["gpt-3.5-turbo", "gpt-4"],
  translation: ["gpt-3.5-turbo", "gpt-4"],
  reasoning: ["gpt-4", "gpt-3.5-turbo"],
  code_generation: ["gpt-4", "gpt-3.5-turbo"],
  legal_review: ["gpt-4", "gpt-3.5-turbo"]
};

const TASK_TYPE_COMPLEXITY_BASELINE: Record<string, number> = {
  classification: 15,
  extraction: 25,
  summarization: 35,
  translation: 30,
  reasoning: 65,
  code_generation: 75,
  legal_review: 80
};

function normalizeTaskType(taskType: string): string {
  return taskType.trim().toLowerCase().replace(/\s+/g, "_");
}

function clampScore(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function resolveRouterWeights(
  scoreWeights?: Partial<RouterScoreWeights>
): RouterScoreWeights {
  return {
    ...DEFAULT_SCORE_WEIGHTS,
    ...scoreWeights
  };
}

function normalizeTier(value: number): number {
  return value / 5;
}

function resolveTaskTypeFitScore(
  taskType: string,
  model: string,
  preferences: Record<string, string[]>
): number {
  const preferredModels = preferences[normalizeTaskType(taskType)] ?? [];
  const preferredIndex = preferredModels.indexOf(model);

  if (preferredIndex === -1 || preferredModels.length === 0) {
    return 0;
  }

  return (preferredModels.length - preferredIndex) / preferredModels.length;
}

function resolveComplexityAlignmentScore(
  context: RoutingRuleContext
): number {
  const qualityScore = normalizeTier(context.capability.qualityTier);
  const speedScore = normalizeTier(context.capability.speedTier);
  const costScore = normalizeTier(context.capability.costTier);

  if (context.complexity.level === "high") {
    return qualityScore;
  }

  if (context.complexity.level === "medium") {
    return (qualityScore + speedScore) / 2;
  }

  return (speedScore + costScore) / 2;
}

function resolveLatencyScore(capability: ModelCapabilityProfile): number {
  if (capability.latencyMs && capability.latencyMs > 0) {
    return 1 / (1 + capability.latencyMs / 1000);
  }

  return normalizeTier(capability.speedTier);
}

function buildRoutingContext(
  input: RouterInput,
  modelPricing: ModelPricing,
  capability: ModelCapabilityProfile,
  complexity: TaskComplexityAssessment
): RoutingRuleContext {
  return {
    input,
    modelPricing,
    capability,
    complexity,
    estimatedCost: estimateCost({
      modelPricing,
      inputTokens: input.estimatedInputTokens,
      outputTokens: input.estimatedOutputTokens ?? 0
    }).totalCost
  };
}

function buildCandidateReason(model: string, scoreDetails: RouterCandidate["scoreDetails"]): string {
  const dominantReason = [...scoreDetails].sort((left, right) => right.score - left.score)[0];

  if (!dominantReason) {
    return `No routing rules produced a score for model "${model}".`;
  }

  return `${dominantReason.reason} (top rule: ${dominantReason.rule}).`;
}

function resolveCandidateModels(
  input: RouterInput,
  modelPricingRegistry: Record<string, ModelPricing>
): string[] {
  const configuredModels = Object.keys(modelPricingRegistry);

  if (configuredModels.length === 0) {
    throw new TokenflyError(
      "ROUTER_MODEL_REGISTRY_EMPTY",
      "No model pricing entries were configured for routing.",
      { taskType: input.taskType }
    );
  }

  if (!input.allowModels || input.allowModels.length === 0) {
    return configuredModels;
  }

  const filteredModels = configuredModels.filter((model) =>
    input.allowModels?.includes(model)
  );

  if (filteredModels.length === 0) {
    throw new TokenflyError(
      "ROUTER_NO_ALLOWED_MODELS",
      "The configured allow-list does not match any known routing models.",
      { allowModels: input.allowModels }
    );
  }

  return filteredModels;
}

/**
 * Estimates task complexity from task type and input size for downstream routing rules.
 *
 * @param input - The task metadata and optional explicit complexity score.
 * @returns A normalized complexity assessment with level, numeric score, and explanation.
 */
export function assessTaskComplexity(
  input: Pick<RouterInput, "taskType" | "estimatedInputTokens" | "complexityScore">
): TaskComplexityAssessment {
  const normalizedTaskType = normalizeTaskType(input.taskType);
  const baselineScore = TASK_TYPE_COMPLEXITY_BASELINE[normalizedTaskType] ?? 40;
  const tokenContribution = Math.min(input.estimatedInputTokens / 100, 20);
  const rawScore = input.complexityScore ?? baselineScore + tokenContribution;
  const score = clampScore(rawScore);
  const level =
    score >= 70 ? "high" : score >= 35 ? "medium" : "low";

  return {
    level,
    score,
    reason:
      input.complexityScore !== undefined
        ? `Complexity score ${score} was provided explicitly for task type "${normalizedTaskType}".`
        : `Complexity score ${score} was derived from task type "${normalizedTaskType}" and ${input.estimatedInputTokens} estimated input tokens.`
  };
}

/**
 * Creates a rule that rewards models aligned with task-specific preferences.
 *
 * @param preferences - Optional task-to-model preference overrides.
 * @param scoreWeights - Optional rule weight overrides for task-type scoring.
 * @returns A routing rule that boosts preferred models for the current task type.
 */
export function createTaskTypeRoutingRule(
  preferences: Record<string, string[]> = TASK_TYPE_MODEL_PREFERENCES,
  scoreWeights?: Partial<RouterScoreWeights>
): RoutingRule {
  const weights = resolveRouterWeights(scoreWeights);

  return {
    name: "task-type",
    evaluate(context) {
      const normalizedTaskType = normalizeTaskType(context.input.taskType);
      const preferredModels = preferences[normalizedTaskType] ?? [];
      const preferredIndex = preferredModels.indexOf(context.modelPricing.model);

      if (preferredIndex === -1) {
        return {
          rule: "task-type",
          score: 0,
          reason: `Task type "${normalizedTaskType}" does not explicitly prefer model "${context.modelPricing.model}".`
        };
      }

      const score = Math.max(
        weights.taskType * (preferredModels.length - preferredIndex),
        0
      );

      return {
        rule: "task-type",
        score,
        reason: `Task type "${normalizedTaskType}" prefers model "${context.modelPricing.model}" at rank ${preferredIndex + 1}.`
      };
    }
  };
}

/**
 * Creates a rule that prefers models fitting inside the caller's budget ceiling.
 *
 * @param scoreWeights - Optional rule weight overrides for cost scoring.
 * @returns A routing rule that penalizes over-budget models and rewards cheaper ones.
 */
export function createBudgetRoutingRule(
  scoreWeights?: Partial<RouterScoreWeights>
): RoutingRule {
  const weights = resolveRouterWeights(scoreWeights);

  return {
    name: "budget-fit",
    evaluate(context) {
      if (context.input.budgetLimit === undefined) {
        return {
          rule: "budget-fit",
          score: 0,
          reason: `No budget limit was provided, so model "${context.modelPricing.model}" receives no explicit budget bonus or penalty.`
        };
      }

      const budgetGap = context.input.budgetLimit - context.estimatedCost;

      if (budgetGap < 0) {
        return {
          rule: "budget-fit",
          score: -Math.min(Math.abs(budgetGap) * 200 * weights.cost, 6),
          reason: `Estimated cost ${context.estimatedCost.toFixed(6)} exceeds budget limit ${context.input.budgetLimit.toFixed(6)} for model "${context.modelPricing.model}".`
        };
      }

      const budgetHeadroomRatio =
        context.input.budgetLimit === 0
          ? 0
          : budgetGap / context.input.budgetLimit;
      const score = Math.min(budgetHeadroomRatio, 1) * 0.75 * weights.cost;

      return {
        rule: "budget-fit",
        score,
        reason: `Model "${context.modelPricing.model}" fits within budget with ${budgetGap.toFixed(6)} USD remaining.`
      };
    }
  };
}

/**
 * Creates a rule that aligns model selection with inferred task complexity.
 *
 * @param scoreWeights - Optional rule weight overrides for complexity scoring.
 * @returns A routing rule that increases quality demand for harder tasks.
 */
export function createComplexityRoutingRule(
  scoreWeights?: Partial<RouterScoreWeights>
): RoutingRule {
  const weights = resolveRouterWeights(scoreWeights);

  return {
    name: "complexity",
    evaluate(context) {
      const score =
        context.complexity.level === "high"
          ? context.capability.qualityTier * weights.complexity
          : context.complexity.level === "medium"
            ? (context.capability.qualityTier + context.capability.speedTier) *
              0.5 *
              weights.complexity
            : context.capability.speedTier * 0.5 * weights.complexity +
              context.capability.costTier * 0.5 * weights.complexity;

      return {
        rule: "complexity",
        score,
        reason: `Complexity level "${context.complexity.level}" favors model "${context.modelPricing.model}" with quality tier ${context.capability.qualityTier} and speed tier ${context.capability.speedTier}.`
      };
    }
  };
}

/**
 * Creates a rule that adapts routing toward speed, balance, or quality preferences.
 *
 * @param scoreWeights - Optional rule weight overrides for quality and latency scoring.
 * @returns A routing rule that reflects the caller's quality preference in model scoring.
 */
export function createQualityPreferenceRoutingRule(
  scoreWeights?: Partial<RouterScoreWeights>
): RoutingRule {
  const weights = resolveRouterWeights(scoreWeights);

  return {
    name: "quality-preference",
    evaluate(context) {
      const preference = context.input.qualityPreference ?? "balanced";
      const score =
        preference === "quality"
          ? context.capability.qualityTier * weights.quality
          : preference === "speed"
            ? context.capability.speedTier * weights.latency
            : ((context.capability.qualityTier + context.capability.speedTier) /
                2) *
              ((weights.quality + weights.latency) / 2);

      return {
        rule: "quality-preference",
        score,
        reason: `Quality preference "${preference}" contributes to model "${context.modelPricing.model}" selection.`
      };
    }
  };
}

/**
 * Creates a weighted cost-quality-latency score for first-pass rule-based routing.
 *
 * @param scoreWeights - Optional routing score weight overrides.
 * @param preferences - Optional task-to-model preference overrides.
 * @returns A routing rule that blends cost, quality, latency, task fit, and complexity alignment.
 */
export function createWeightedScoreRoutingRule(
  scoreWeights?: Partial<RouterScoreWeights>,
  preferences: Record<string, string[]> = TASK_TYPE_MODEL_PREFERENCES
): RoutingRule {
  const weights = resolveRouterWeights(scoreWeights);

  return {
    name: "weighted-score",
    evaluate(context) {
      const qualityPreference = context.input.qualityPreference ?? "balanced";
      const qualityMultiplier =
        qualityPreference === "quality"
          ? 1.35
          : qualityPreference === "speed"
            ? 0.75
            : 1;
      const latencyMultiplier =
        qualityPreference === "speed"
          ? 1.35
          : qualityPreference === "quality"
            ? 0.75
            : 1;
      const costMultiplier =
        context.input.budgetLimit === undefined ? 0.85 : 1;
      const qualityScore = normalizeTier(context.capability.qualityTier);
      const costScore = normalizeTier(context.capability.costTier);
      const latencyScore = resolveLatencyScore(context.capability);
      const taskTypeFitScore = resolveTaskTypeFitScore(
        context.input.taskType,
        context.modelPricing.model,
        preferences
      );
      const complexityAlignmentScore =
        resolveComplexityAlignmentScore(context);
      const score =
        qualityScore * weights.quality * qualityMultiplier +
        costScore * weights.cost * costMultiplier +
        latencyScore * weights.latency * latencyMultiplier +
        taskTypeFitScore * weights.taskType +
        complexityAlignmentScore * weights.complexity;

      return {
        rule: "weighted-score",
        score,
        reason: `Weighted score combines cost ${costScore.toFixed(2)}, quality ${qualityScore.toFixed(2)}, latency ${latencyScore.toFixed(2)}, task fit ${taskTypeFitScore.toFixed(2)}, and complexity alignment ${complexityAlignmentScore.toFixed(2)} for model "${context.modelPricing.model}".`
      };
    }
  };
}

/**
 * Builds the default rule set for the first router implementation.
 *
 * @param scoreWeights - Optional routing score weight overrides.
 * @returns The ordered default routing rules used by `routeModel`.
 */
export function createDefaultRoutingRules(
  scoreWeights?: Partial<RouterScoreWeights>
): RoutingRule[] {
  return [
    createWeightedScoreRoutingRule(scoreWeights),
    createTaskTypeRoutingRule(undefined, scoreWeights),
    createBudgetRoutingRule(scoreWeights),
    createComplexityRoutingRule(scoreWeights),
    createQualityPreferenceRoutingRule(scoreWeights)
  ];
}

/**
 * Routes a task to the best-fit model using a configurable rule engine.
 *
 * @param input - The task metadata, token estimate, and optional budget constraints.
 * @param options - Optional pricing, capabilities, score weights, and custom routing rules.
 * @returns A ranked routing decision with the selected model, reasons, and candidate scores.
 * @throws TokenflyError When no candidate models are available or a model capability profile is missing.
 */
export function routeModel(
  input: RouterInput,
  options: RouterOptions = {}
): RouterResult {
  const modelPricingRegistry =
    options.modelPricingRegistry ?? DEFAULT_MODEL_PRICING;
  const modelCapabilities = {
    ...DEFAULT_MODEL_CAPABILITIES,
    ...options.modelCapabilities
  };
  const candidateModels = resolveCandidateModels(input, modelPricingRegistry);
  const complexity = assessTaskComplexity(input);
  const rules =
    options.rules ?? createDefaultRoutingRules(options.scoreWeights);

  const candidates = candidateModels
    .map((model): RouterCandidate => {
      const modelPricing = modelPricingRegistry[model];
      const capability = modelCapabilities[model];

      if (!capability) {
        throw new TokenflyError(
          "ROUTER_MODEL_CAPABILITY_NOT_FOUND",
          `No model capability profile was found for "${model}".`,
          { model }
        );
      }

      const context = buildRoutingContext(
        input,
        modelPricing,
        capability,
        complexity
      );
      const scoreDetails = rules.map((rule) => rule.evaluate(context));
      const totalScore = scoreDetails.reduce(
        (sum, detail) => sum + detail.score,
        0
      );

      return {
        model,
        totalScore,
        reason: buildCandidateReason(model, scoreDetails),
        estimatedCost: context.estimatedCost,
        capability,
        pricing: modelPricing,
        scoreDetails
      };
    })
    .sort((left, right) => right.totalScore - left.totalScore);

  const selectedCandidate = candidates[0];

  if (!selectedCandidate) {
    throw new TokenflyError(
      "ROUTER_NO_CANDIDATES",
      "Routing did not produce any candidate models.",
      { taskType: input.taskType }
    );
  }

  return {
    selectedModel: selectedCandidate.model,
    reason: selectedCandidate.reason,
    candidates,
    complexity
  };
}
