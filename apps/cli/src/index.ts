import {
  checkBudget as coreCheckBudget,
  estimateCost as coreEstimateCost,
  estimateFileContentTokens as coreEstimateFileContentTokens,
  estimateTokens as coreEstimateTokens,
  getModelPricing as coreGetModelPricing
} from "@tokenfly/core";
import type {
  BudgetCheckInput,
  BudgetCheckResult,
  CostEstimateInput,
  CostEstimateResult,
  ModelPricing,
  TokenEstimateResult
} from "./types";

export type {
  BudgetCheckInput,
  BudgetCheckResult,
  CostEstimateInput,
  CostEstimateResult,
  ModelPricing,
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
