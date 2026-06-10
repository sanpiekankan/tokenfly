# tokenfly

`tokenfly` is a lightweight Node.js toolkit for estimating prompt tokens, basic request costs, and budget fit for LLM workloads. The current MVP uses a deterministic heuristic strategy instead of a heavyweight tokenizer dependency.

## Installation

Install `tokenfly` in your project:

```bash
npm install tokenfly
```

Install it globally if you want the `tokenfly` CLI available everywhere:

```bash
npm install -g tokenfly
```

## Usage

### CLI Usage

Estimate tokens for a prompt file:

```bash
tokenfly prompt.md

# Equivalent explicit form
tokenfly -count prompt.md
```

Estimate tokens for inline text:

```bash
tokenfly --text "Summarize this document into three bullet points."
```

Return structured JSON output:

```bash
tokenfly --text "Hello 世界" --json
```

Include cost estimation and a budget check:

```bash
tokenfly prompt.md --model gpt-4 --output-tokens 300 --budget 0.01
```

CLI options:

- `tokenfly <file>`: Estimate tokens from a file path.
- `tokenfly -count <file>`: Estimate tokens from a file path using the explicit count flag.
- `tokenfly --text "<prompt>"`: Estimate tokens from inline text.
- `tokenfly --model <name>`: Select the pricing model used for reporting.
- `tokenfly --output-tokens <num>`: Add estimated output tokens to the cost calculation.
- `tokenfly --budget <usd>`: Check whether the estimated cost fits within a budget.
- `tokenfly --json`: Print machine-readable JSON output.
- `tokenfly --help`: Show the CLI help message.

Example CLI output:

```text
File: prompt.md
Model: gpt-4
Estimated Token Count: 168
Estimated Cost (USD): 0.00504
Budget Status: allow
Budget Reason: Estimated cost is within the configured budget limit.
```

### Programmatic Usage

`tokenfly` re-exports the core APIs for both CommonJS and ES Modules.

CommonJS:

```javascript
const {
  estimateTokens,
  estimateCost,
  getModelPricing,
  checkBudget
} = require("tokenfly");

const estimate = estimateTokens("Hello world", "gpt-4");
const cost = estimateCost({
  modelPricing: getModelPricing("gpt-4"),
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

ES Modules:

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

## API Reference

### `estimateTokens(text, model?)`

Estimates tokens for plain text and returns a structured result.

- `text` (`string`): The text content to estimate.
- `model` (`string`, optional): The model name used for reporting. Defaults to `gpt-4`.

Returns:

```javascript
{
  tokenCount: 3,
  method: "heuristic-v1",
  model: "gpt-4"
}
```

### `estimateFileContentTokens(content, model?)`

Estimates tokens for file content that has already been loaded into memory.

### `getModelPricing(model)`

Returns pricing metadata for a known model.

### `estimateCost({ modelPricing, inputTokens, outputTokens })`

Returns:

```javascript
{
  inputCost: 0.00009,
  outputCost: 0,
  totalCost: 0.00009,
  currency: "USD"
}
```

### `checkBudget({ budgetLimit, estimatedCost, warningThreshold })`

Returns a structured budget decision with `allow`, `warn`, or `block`.

## How Token Estimation Works

To keep the package lightweight and dependency-free, `tokenfly` uses a deterministic heuristic strategy:

- CJK characters: approximately `1.5` tokens each
- English words and numbers: approximately `1.3` tokens each
- Punctuation and symbols: approximately `1.0` token each

This approach is designed for fast estimation, cost previews, and budget checks. It is not intended to exactly match every provider tokenizer.
