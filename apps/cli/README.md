# tokenfly

`tokenfly` is a lightweight npm package and CLI for estimating prompt tokens, previewing request costs, and checking budget fit for LLM workloads.

## Installation

Install `tokenfly` in your project:

```bash
npm install tokenfly
```

Install it globally if you want the CLI available everywhere:

```bash
npm install -g tokenfly
```

## Quick Start

Estimate tokens from a Markdown prompt file:

```bash
tokenfly prompt.md
```

Use the explicit count flag:

```bash
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

Estimate cost and check a budget:

```bash
tokenfly prompt.md --model gpt-4 --output-tokens 300 --budget 0.01
```

## CLI Options

- `tokenfly <file>`: Estimate tokens from a file path.
- `tokenfly -count <file>`: Estimate tokens from a file path using the explicit count flag.
- `tokenfly --text "<prompt>"`: Estimate tokens from inline text.
- `tokenfly --model <name>`: Select the pricing model used for reporting.
- `tokenfly --output-tokens <num>`: Add estimated output tokens to the cost calculation.
- `tokenfly --budget <usd>`: Check whether the estimated cost fits within a budget.
- `tokenfly --json`: Print machine-readable JSON output.
- `tokenfly --help`: Show the CLI help message.

## Programmatic Usage

CommonJS:

```javascript
const {
  checkBudget,
  estimateCost,
  estimateTokens,
  getModelPricing
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

## API Overview

### `estimateTokens(text, model?)`

Estimates tokens for plain text and returns:

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

## Token Estimation Method

To keep the package lightweight and dependency-free, `tokenfly` uses a deterministic heuristic strategy:

- CJK characters: about `1.5` tokens each
- English words and numbers: about `1.3` tokens each
- Punctuation and symbols: about `1.0` token each

This method is intended for fast estimation, cost previews, and budget checks. It does not guarantee an exact match with every provider tokenizer.
