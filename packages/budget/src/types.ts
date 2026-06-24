import type { BudgetCheckResult } from "@tokenfly/core";
import type { Logger } from "@tokenfly/shared";

export type BudgetEnforcementMode = "block" | "recommend_downgrade";

export type BudgetDecision = "allow" | "block" | "recommend_downgrade";

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

export interface BudgetDowngradeCandidate {
  model: string;
  estimatedCost: number;
  reason?: string;
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

export interface BudgetRule {
  name: string;
  evaluate(context: BudgetRuleContext): BudgetRuleEvaluation;
}

export interface BudgetOptions {
  taskValueFunction?: TaskValueFunction;
  rules?: BudgetRule[];
  logger?: Logger;
}
