import type { CostEstimateInput, CostEstimateResult } from "./types";

/**
 * Calculates model invocation cost from token counts and pricing metadata.
 *
 * @param input - The pricing record and token counts to use for the calculation.
 * @returns A structured cost estimate in USD.
 */
export function estimateCost(input: CostEstimateInput): CostEstimateResult {
  const inputTokens = input.inputTokens ?? 0;
  const outputTokens = input.outputTokens ?? 0;

  const inputCost = (inputTokens / 1000) * input.modelPricing.inputPricePer1k;
  const outputCost =
    (outputTokens / 1000) * input.modelPricing.outputPricePer1k;
  const totalCost = inputCost + outputCost;

  return {
    inputCost: roundUsd(inputCost),
    outputCost: roundUsd(outputCost),
    totalCost: roundUsd(totalCost),
    currency: "USD"
  };
}

/**
 * Normalizes floating-point currency values to six decimal places.
 *
 * @param value - The raw currency value.
 * @returns A normalized USD amount.
 */
export function roundUsd(value: number): number {
  return Number(value.toFixed(6));
}
