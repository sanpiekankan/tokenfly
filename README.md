# tokenfly

`tokenfly` is a lightweight npm package and CLI for:

- estimating prompt tokens
- previewing request costs
- checking budget fit
- routing tasks to candidate models
- recommending downgrade paths when budgets are tight

The package is dependency-light, ships with bundled pricing defaults, and exposes both CLI and SDK workflows.

## Installation

Install it in your project:

```bash
npm install tokenfly
```

Install it globally if you want the CLI available everywhere:

```bash
npm install -g tokenfly
```

## Built-In Models

The package currently ships with pricing defaults for:

- `gpt-4`
- `gpt-3.5-turbo`

You can also override pricing and capability data in SDK usage.

## CLI Quick Start

Estimate tokens from a Markdown or text file:

```bash
tokenfly prompt.md
```

Use the explicit count flag:

```bash
tokenfly -count prompt.md
```

Estimate tokens from inline text:

```bash
tokenfly --text "Summarize this document into three bullet points."
```

Return structured JSON output:

```bash
tokenfly --text "Hello 世界" --json
```

Estimate request cost and check a budget:

```bash
tokenfly prompt.md --model gpt-4 --output-tokens 300 --budget 0.01
```

Show CLI help:

```bash
tokenfly --help
```

## CLI Reference

Supported input modes:

- `tokenfly <file>`
- `tokenfly -count <file>`
- `tokenfly --text "<prompt>"`

Supported options:

- `--model <name>`: Select the target model used for reporting.
- `--output-tokens <num>`: Include estimated output tokens in the cost preview.
- `--budget <usd>`: Check whether the estimated cost fits the given budget.
- `--json`: Print machine-readable JSON output.
- `--help`, `-h`: Show the help message.

Example plain-text output:

```text
File: prompt.md
Model: gpt-4
Estimated Token Count: 128
Estimated Cost (USD): 0.00384
Budget Status: allow
Budget Reason: Estimated cost is within the configured budget limit.
```

Example JSON output:

```json
{
  "model": "gpt-4",
  "tokenCount": 3,
  "estimatedCost": 0.00009
}
```

CLI exit codes:

- `0`: success
- `1`: invalid arguments
- `2`: file not found
- `3`: runtime error

## SDK Quick Start

### CommonJS

```javascript
const {
  checkBudget,
  estimateCost,
  estimateTokens,
  getModelPricing
} = require("tokenfly");

const estimate = estimateTokens("Hello world", "gpt-4");
const pricing = getModelPricing("gpt-4");
const cost = estimateCost({
  modelPricing: pricing,
  inputTokens: estimate.tokenCount,
  outputTokens: 150
});
const budget = checkBudget({
  budgetLimit: 0.01,
  estimatedCost: cost.totalCost
});

console.log(estimate);
console.log(cost);
console.log(budget);
```

### ESM

```javascript
import {
  checkBudget,
  estimateCost,
  estimateTokens,
  getModelPricing
} from "tokenfly";

const estimate = estimateTokens("Hello world", "gpt-4");
const cost = estimateCost({
  modelPricing: getModelPricing("gpt-4"),
  inputTokens: estimate.tokenCount
});
const budget = checkBudget({
  budgetLimit: 0.01,
  estimatedCost: cost.totalCost
});

console.log(estimate);
console.log(cost);
console.log(budget);
```

## SDK Features

### 1. Token Estimation

Estimate text directly:

```javascript
import { estimateTokens } from "tokenfly";

const result = estimateTokens("Hello world", "gpt-4");

console.log(result);
```

Example result:

```javascript
{
  tokenCount: 3,
  method: "heuristic-v1",
  model: "gpt-4"
}
```

Estimate already-loaded file content:

```javascript
import fs from "node:fs";
import { estimateFileContentTokens } from "tokenfly";

const content = fs.readFileSync("./prompt.md", "utf8");
const result = estimateFileContentTokens(content, "gpt-4");

console.log(result);
```

### 2. Pricing And Cost Estimation

```javascript
import { estimateCost, estimateTokens, getModelPricing } from "tokenfly";

const estimate = estimateTokens("Write a short product summary.", "gpt-4");
const pricing = getModelPricing("gpt-4");
const cost = estimateCost({
  modelPricing: pricing,
  inputTokens: estimate.tokenCount,
  outputTokens: 200
});

console.log(cost);
```

Example result:

```javascript
{
  inputCost: 0.00009,
  outputCost: 0.012,
  totalCost: 0.01209,
  currency: "USD"
}
```

### 3. Basic Budget Checks

```javascript
import { checkBudget } from "tokenfly";

const result = checkBudget({
  budgetLimit: 0.01,
  estimatedCost: 0.01209,
  warningThreshold: 0.008
});

console.log(result);
```

The result uses `allow`, `warn`, or `block`.

### 4. Task Complexity Assessment

```javascript
import { assessTaskComplexity } from "tokenfly";

const complexity = assessTaskComplexity({
  taskType: "code_generation",
  estimatedInputTokens: 4000
});

console.log(complexity);
```

### 5. Intelligent Model Routing

Use the stage-2 routing engine to rank candidate models:

```javascript
import { routeModel } from "tokenfly";

const route = routeModel({
  taskType: "code_generation",
  estimatedInputTokens: 4000,
  estimatedOutputTokens: 500,
  budgetLimit: 0.2,
  qualityPreference: "quality"
});

console.log(route.selectedModel);
console.log(route.candidates);
```

Typical result fields:

- `selectedModel`
- `reason`
- `candidates`
- `complexity`

Each candidate includes:

- `model`
- `totalScore`
- `estimatedCost`
- `pricing`
- `capability`
- `scoreDetails`

### 6. Budget Enforcement With Downgrade Recommendations

Use the budget engine after you already know the selected model and estimated cost:

```javascript
import { enforceBudget } from "tokenfly";

const result = enforceBudget({
  taskType: "legal_review",
  budgetLimit: 0.01,
  estimatedCost: 0.02,
  selectedModel: "gpt-4",
  fallbackModel: "gpt-3.5-turbo",
  downgradeCandidates: [
    {
      model: "gpt-3.5-turbo",
      estimatedCost: 0.005
    }
  ]
});

console.log(result);
```

The result includes:

- `decision`: `allow`, `block`, or `recommend_downgrade`
- `finalModel`
- `finalCost`
- `downgraded`
- `evaluations`
- `logEntry`

### 7. Task Value Policies

Create a task-value function that changes downgrade behavior:

```javascript
import { createTaskTypeValueFunction, enforceBudget } from "tokenfly";

const taskValueFunction = createTaskTypeValueFunction({
  legal_review: 0.95,
  classification: 0.4
});

const result = enforceBudget(
  {
    taskType: "legal_review",
    budgetLimit: 0.01,
    estimatedCost: 0.02,
    selectedModel: "gpt-4",
    fallbackModel: "gpt-3.5-turbo",
    downgradeCandidates: [
      {
        model: "gpt-3.5-turbo",
        estimatedCost: 0.005
      }
    ]
  },
  {
    taskValueFunction
  }
);

console.log(result.decision);
```

### 8. End-To-End Request Planning

If you want a single SDK call that does token estimation, routing, budget evaluation, and downgrade handling, use `planRequest()`:

```javascript
import {
  createConsoleLogger,
  createTaskTypeValueFunction,
  planRequest
} from "tokenfly";

const result = planRequest({
  text: "Write a careful legal summary for this contract.",
  taskType: "legal_review",
  budgetLimit: 0.01,
  qualityPreference: "quality",
  estimatedOutputTokens: 200,
  logger: createConsoleLogger(),
  taskValueFunction: createTaskTypeValueFunction({
    legal_review: 0.95
  })
});

console.log(result.selectedModel);
console.log(result.finalModel);
console.log(result.budget?.decision);
console.log(result.budget?.logEntry);
```

Use `planRequest()` when you want the full stage-2 decision chain in one call.

### 9. Structured Logging

If you want a ready-to-use logger for budget-aware planning:

```javascript
import { createConsoleLogger } from "tokenfly";

const logger = createConsoleLogger();

logger.info("Planning request", { taskType: "legal_review" });
```

## API Overview

Core APIs:

- `estimateTokens(text, model?)`
- `estimateFileContentTokens(content, model?)`
- `getModelPricing(model)`
- `estimateCost({ modelPricing, inputTokens, outputTokens })`
- `checkBudget({ budgetLimit, estimatedCost, warningThreshold, taskType })`

Stage-2 SDK APIs:

- `assessTaskComplexity({ taskType, estimatedInputTokens, complexityScore? })`
- `routeModel(routerInput, routerOptions?)`
- `enforceBudget(budgetRuleInput, budgetOptions?)`
- `createTaskTypeValueFunction(overrides?)`
- `createConsoleLogger()`
- `planRequest(planRequestInput)`

## Token Estimation Method

To keep the package lightweight and dependency-free, `tokenfly` uses a deterministic heuristic strategy:

- CJK characters: about `1.5` tokens each
- English words and numbers: about `1.3` tokens each
- Punctuation and symbols: about `1.0` token each

This method is intended for fast estimation, cost previews, routing preparation, and budget checks. It does not guarantee an exact match with every provider tokenizer.

## Notes

- The CLI currently focuses on token estimation, cost previews, JSON output, and basic budget checks.
- Advanced routing and downgrade planning are currently exposed through the SDK API.
- This root README is the single source of truth for both GitHub and the published npm package.
