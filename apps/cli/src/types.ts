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

export type BudgetEnforcementMode = "block" | "recommend_downgrade";

export type BudgetDecision = "allow" | "block" | "recommend_downgrade";

export interface BudgetDowngradeCandidate {
  model: string;
  estimatedCost: number;
  reason?: string;
}

export interface BudgetRuleInput {
  taskType: string;
  budgetLimit: number;
  estimatedCost: number;
  selectedModel?: string;
  fallbackModel?: string;
  downgradeCandidates?: BudgetDowngradeCandidate[];
  warningThreshold?: number;
  mode?: BudgetEnforcementMode;
}

export interface TaskValueAssessment {
  score: number;
  reason: string;
  recommendedBudget?: number;
}

export interface TaskValueContext {
  taskType: string;
  estimatedCost: number;
  budgetLimit: number;
  selectedModel?: string;
  fallbackModel?: string;
}

export type TaskValueFunction = (
  context: TaskValueContext
) => TaskValueAssessment;

export interface BudgetRuleContext {
  input: BudgetRuleInput;
  budgetCheck: BudgetCheckResult;
  taskValue: TaskValueAssessment;
}

export interface BudgetRuleEvaluation {
  rule: string;
  triggered: boolean;
  decision: BudgetDecision;
  reason: string;
  recommendedModel?: string;
  recommendedCost?: number;
}

export interface BudgetLogEntry {
  taskType: string;
  budgetLimit: number;
  estimatedCost: number;
  finalCost: number;
  selectedModel?: string;
  finalModel?: string;
  recommendedModel?: string;
  downgraded: boolean;
  blocked: boolean;
  decision: BudgetDecision;
}

export interface BudgetEnforcementResult {
  allowed: boolean;
  decision: BudgetDecision;
  reason: string;
  estimatedCost: number;
  finalCost: number;
  recommendedModel?: string;
  finalModel?: string;
  downgraded: boolean;
  taskValue: TaskValueAssessment;
  budgetCheck: BudgetCheckResult;
  evaluations: BudgetRuleEvaluation[];
  logEntry: BudgetLogEntry;
}

export interface BudgetRule {
  name: string;
  evaluate(context: BudgetRuleContext): BudgetRuleEvaluation;
}

export interface SdkLogger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export interface BudgetOptions {
  taskValueFunction?: TaskValueFunction;
  rules?: BudgetRule[];
  logger?: SdkLogger;
}

export interface PlanRequestInput {
  text: string;
  taskType: string;
  model?: string;
  budgetLimit?: number;
  qualityPreference?: RouterQualityPreference;
  estimatedOutputTokens?: number;
  complexityScore?: number;
  allowModels?: string[];
  fallbackModel?: string;
  warningThreshold?: number;
  mode?: BudgetEnforcementMode;
  modelPricingRegistry?: Record<string, ModelPricing>;
  modelCapabilities?: Record<string, ModelCapabilityProfile>;
  scoreWeights?: Partial<RouterScoreWeights>;
  taskValueFunction?: TaskValueFunction;
  logger?: SdkLogger;
}

export interface PlanRequestResult {
  tokenEstimate: TokenEstimateResult;
  route: RouterResult;
  budget?: BudgetEnforcementResult;
  selectedModel: string;
  finalModel: string;
  estimatedInputTokens: number;
  estimatedCost: number;
  finalEstimatedCost: number;
  downgraded: boolean;
}
