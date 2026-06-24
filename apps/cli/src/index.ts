import {
  createTaskTypeValueFunction as budgetCreateTaskTypeValueFunction,
  enforceBudget as budgetEnforceBudget
} from "@tokenfly/budget";
import {
  checkBudget as coreCheckBudget,
  estimateCost as coreEstimateCost,
  estimateFileContentTokens as coreEstimateFileContentTokens,
  estimateTokens as coreEstimateTokens,
  getModelPricing as coreGetModelPricing
} from "@tokenfly/core";
import {
  assessTaskComplexity as routerAssessTaskComplexity,
  routeModel as routerRouteModel
} from "@tokenfly/router";
import { createConsoleLogger as sharedCreateConsoleLogger } from "@tokenfly/shared";
import type {
  BudgetCheckInput,
  BudgetCheckResult,
  BudgetEnforcementResult,
  BudgetOptions,
  CostEstimateInput,
  CostEstimateResult,
  ModelPricing,
  PlanRequestInput,
  PlanRequestResult,
  RouterInput,
  RouterOptions,
  RouterResult,
  SdkLogger,
  TaskComplexityAssessment,
  TaskValueFunction,
  TokenEstimateResult
} from "./types";

export type {
  BudgetCheckInput,
  BudgetCheckResult,
  BudgetEnforcementResult,
  BudgetOptions,
  CostEstimateInput,
  CostEstimateResult,
  ModelCapabilityProfile,
  ModelPricing,
  PlanRequestInput,
  PlanRequestResult,
  RouterInput,
  RouterOptions,
  RouterResult,
  SdkLogger,
  TaskComplexityAssessment,
  TaskValueFunction,
  TokenEstimateResult
} from "./types";

/**
 * Estimates tokens for plain text with the bundled tokenfly heuristic engine.
 *
 * @param text - The input text to analyze.
 * @param model - The target model used for reporting.
 * @returns A structured token estimation result.
 */
export function estimateTokens(
  text: string,
  model?: string
): TokenEstimateResult {
  return coreEstimateTokens(text, model);
}

/**
 * Estimates tokens for already loaded file content.
 *
 * @param fileContent - The text content read from a file.
 * @param model - The target model used for reporting.
 * @returns A structured token estimation result.
 */
export function estimateFileContentTokens(
  fileContent: string,
  model?: string
): TokenEstimateResult {
  return coreEstimateFileContentTokens(fileContent, model);
}

/**
 * Resolves bundled model pricing metadata for a known model identifier.
 *
 * @param model - The model name to look up.
 * @returns The pricing definition for the requested model.
 */
export function getModelPricing(model: string): ModelPricing {
  return coreGetModelPricing(model);
}

/**
 * Calculates the estimated request cost from token counts and pricing metadata.
 *
 * @param input - The pricing definition and token counts to evaluate.
 * @returns A structured USD cost estimate.
 */
export function estimateCost(input: CostEstimateInput): CostEstimateResult {
  return coreEstimateCost(input);
}

/**
 * Checks whether an estimated request cost fits within a configured budget.
 *
 * @param input - The budget rule and current estimate to evaluate.
 * @returns A structured allow, warn, or block decision.
 */
export function checkBudget(input: BudgetCheckInput): BudgetCheckResult {
  return coreCheckBudget(input);
}

/**
 * Builds a console logger that SDK callers can pass into budget-aware planning flows.
 *
 * @returns A structured logger implementation backed by the current console.
 */
export function createConsoleLogger(): SdkLogger {
  return sharedCreateConsoleLogger();
}

/**
 * Estimates task complexity from task type and input size for routing decisions.
 *
 * @param input - The routing metadata used to score task complexity.
 * @returns A normalized complexity assessment for the current request.
 */
export function assessTaskComplexity(
  input: Pick<RouterInput, "taskType" | "estimatedInputTokens" | "complexityScore">
): TaskComplexityAssessment {
  return routerAssessTaskComplexity(input);
}

/**
 * Routes a request to a candidate model list using the staged tokenfly rule engine.
 *
 * @param input - The routing metadata, token counts, and optional budget hints.
 * @param options - Optional pricing registry, capability profiles, and custom rule configuration.
 * @returns The selected model plus ranked candidates and explanatory score details.
 */
export function routeModel(
  input: RouterInput,
  options?: RouterOptions
): RouterResult {
  return routerRouteModel(input, options);
}

/**
 * Evaluates a routed request against budget rules and optional downgrade paths.
 *
 * @param input - The budget context including selected model, estimated cost, and downgrade candidates.
 * @param options - Optional task-value strategy, custom rules, and structured logger.
 * @returns A structured allow, block, or downgrade decision with log metadata.
 */
export function enforceBudget(
  input: import("./types").BudgetRuleInput,
  options?: BudgetOptions
): BudgetEnforcementResult {
  return budgetEnforceBudget(input, options);
}

/**
 * Creates a task-value function that callers can inject into budget enforcement.
 *
 * @param overrides - Optional per-task overrides for value scoring.
 * @returns A task-value function suitable for `enforceBudget` or `planRequest`.
 */
export function createTaskTypeValueFunction(
  overrides?: Record<string, number | import("./types").TaskValueAssessment>
): TaskValueFunction {
  return budgetCreateTaskTypeValueFunction(overrides);
}

/**
 * Plans a model request end to end by estimating tokens, routing candidates, checking budget, and auto-downgrading when needed.
 *
 * @param input - The request text plus routing, budget, and scoring configuration.
 * @returns A combined routing and budget result with the selected and final model decision.
 */
export function planRequest(input: PlanRequestInput): PlanRequestResult {
  const tokenEstimate = coreEstimateTokens(input.text, input.model);
  const route = routerRouteModel(
    {
      taskType: input.taskType,
      estimatedInputTokens: tokenEstimate.tokenCount,
      budgetLimit: input.budgetLimit,
      qualityPreference: input.qualityPreference,
      estimatedOutputTokens: input.estimatedOutputTokens,
      complexityScore: input.complexityScore,
      allowModels: input.allowModels
    },
    {
      modelPricingRegistry: input.modelPricingRegistry,
      modelCapabilities: input.modelCapabilities,
      scoreWeights: input.scoreWeights
    }
  );
  const selectedCandidate =
    route.candidates.find((candidate) => candidate.model === route.selectedModel) ??
    route.candidates[0];

  if (!selectedCandidate) {
    return {
      tokenEstimate,
      route,
      selectedModel: route.selectedModel,
      finalModel: route.selectedModel,
      estimatedInputTokens: tokenEstimate.tokenCount,
      estimatedCost: 0,
      finalEstimatedCost: 0,
      downgraded: false
    };
  }

  const estimatedCost = selectedCandidate.estimatedCost;

  if (input.budgetLimit === undefined) {
    return {
      tokenEstimate,
      route,
      selectedModel: selectedCandidate.model,
      finalModel: selectedCandidate.model,
      estimatedInputTokens: tokenEstimate.tokenCount,
      estimatedCost,
      finalEstimatedCost: estimatedCost,
      downgraded: false
    };
  }

  const downgradeCandidates = route.candidates
    .filter((candidate) => candidate.model !== selectedCandidate.model)
    .map((candidate) => ({
      model: candidate.model,
      estimatedCost: candidate.estimatedCost,
      reason: candidate.reason
    }));
  const budget = budgetEnforceBudget(
    {
      taskType: input.taskType,
      budgetLimit: input.budgetLimit,
      estimatedCost,
      selectedModel: selectedCandidate.model,
      fallbackModel: input.fallbackModel ?? downgradeCandidates[0]?.model,
      downgradeCandidates,
      warningThreshold: input.warningThreshold,
      mode: input.mode ?? "recommend_downgrade"
    },
    {
      taskValueFunction: input.taskValueFunction,
      logger: input.logger
    }
  );

  return {
    tokenEstimate,
    route,
    budget,
    selectedModel: selectedCandidate.model,
    finalModel: budget.finalModel ?? selectedCandidate.model,
    estimatedInputTokens: tokenEstimate.tokenCount,
    estimatedCost,
    finalEstimatedCost: budget.finalCost,
    downgraded: budget.downgraded
  };
}
