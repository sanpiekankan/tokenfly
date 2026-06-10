import type { BudgetCheckInput, BudgetCheckResult } from "./types";

/**
 * Checks whether an estimated request cost fits within the configured budget policy.
 *
 * @param input - The budget rule and estimated request cost to evaluate.
 * @returns A structured budget decision that callers can use for blocking or warning.
 */
export function checkBudget(input: BudgetCheckInput): BudgetCheckResult {
  const warningThreshold =
    input.warningThreshold ?? Math.max(input.budgetLimit * 0.8, 0);

  if (input.estimatedCost > input.budgetLimit) {
    return {
      allowed: false,
      status: "block",
      reason: `Estimated cost ${input.estimatedCost.toFixed(
        6
      )} exceeds budget limit ${input.budgetLimit.toFixed(6)}.`,
      estimatedCost: input.estimatedCost
    };
  }

  if (input.estimatedCost >= warningThreshold) {
    return {
      allowed: true,
      status: "warn",
      reason: `Estimated cost ${input.estimatedCost.toFixed(
        6
      )} is close to the configured budget limit.`,
      estimatedCost: input.estimatedCost
    };
  }

  return {
    allowed: true,
    status: "allow",
    reason: "Estimated cost is within the configured budget limit.",
    estimatedCost: input.estimatedCost
  };
}
