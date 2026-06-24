import type { BudgetCheckResult } from "@tokenfly/core";

export type BudgetEnforcementMode = "block" | "recommend_downgrade";

export type BudgetDecision = "allow" | "block" | "recommend_downgrade";

export interface BudgetRuleInput {
  taskType: string;
  budgetLimit: number;
  estimatedCost: number;
  selectedModel?: string;
  fallbackModel?: string;
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
}

export interface BudgetEnforcementResult {
  allowed: boolean;
  decision: BudgetDecision;
  reason: string;
  estimatedCost: number;
  recommendedModel?: string;
  taskValue: TaskValueAssessment;
  budgetCheck: BudgetCheckResult;
  evaluations: BudgetRuleEvaluation[];
}

export interface BudgetRule {
  name: string;
  evaluate(context: BudgetRuleContext): BudgetRuleEvaluation;
}

export interface BudgetOptions {
  taskValueFunction?: TaskValueFunction;
  rules?: BudgetRule[];
}
