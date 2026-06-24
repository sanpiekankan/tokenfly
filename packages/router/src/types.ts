import type { ModelPricing } from "@tokenfly/core";

export type RouterQualityPreference = "speed" | "balanced" | "quality";

export type TaskComplexityLevel = "low" | "medium" | "high";

export interface TaskComplexityAssessment {
  level: TaskComplexityLevel;
  score: number;
  reason: string;
}

export interface ModelCapabilityProfile {
  model: string;
  qualityTier: number;
  speedTier: number;
  costTier: number;
  latencyMs?: number;
  maxRecommendedInputTokens?: number;
}

export interface RouterInput {
  taskType: string;
  estimatedInputTokens: number;
  budgetLimit?: number;
  qualityPreference?: RouterQualityPreference;
  estimatedOutputTokens?: number;
  complexityScore?: number;
  allowModels?: string[];
}

export interface RouterCandidateScoreDetail {
  rule: string;
  score: number;
  reason: string;
}

export interface RouterCandidate {
  model: string;
  totalScore: number;
  reason: string;
  estimatedCost: number;
  capability: ModelCapabilityProfile;
  pricing: ModelPricing;
  scoreDetails: RouterCandidateScoreDetail[];
}

export interface RouterResult {
  selectedModel: string;
  reason: string;
  candidates: RouterCandidate[];
  complexity: TaskComplexityAssessment;
}

export interface RoutingRuleContext {
  input: RouterInput;
  modelPricing: ModelPricing;
  capability: ModelCapabilityProfile;
  complexity: TaskComplexityAssessment;
  estimatedCost: number;
}

export interface RoutingRuleResult {
  rule: string;
  score: number;
  reason: string;
}

export interface RoutingRule {
  name: string;
  evaluate(context: RoutingRuleContext): RoutingRuleResult;
}

export interface RouterScoreWeights {
  cost: number;
  quality: number;
  latency: number;
  taskType: number;
  complexity: number;
}

export interface RouterOptions {
  modelPricingRegistry?: Record<string, ModelPricing>;
  modelCapabilities?: Record<string, ModelCapabilityProfile>;
  rules?: RoutingRule[];
  scoreWeights?: Partial<RouterScoreWeights>;
}
