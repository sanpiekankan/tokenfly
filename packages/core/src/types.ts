export interface ModelPricing {
  model: string;
  provider: string;
  inputPricePer1k: number;
  outputPricePer1k: number;
  contextWindow: number;
}

export interface TokenEstimateResult {
  tokenCount: number;
  method: "heuristic-v1";
  model: string;
}

export interface CostEstimateInput {
  modelPricing: ModelPricing;
  inputTokens?: number;
  outputTokens?: number;
}

export interface CostEstimateResult {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: "USD";
}

export interface BudgetCheckInput {
  budgetLimit: number;
  estimatedCost: number;
  taskType?: string;
  warningThreshold?: number;
}

export interface BudgetCheckResult {
  allowed: boolean;
  status: "allow" | "warn" | "block";
  reason: string;
  estimatedCost: number;
}
