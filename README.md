# tokenfly

A lightweight, **zero-dependency** npm package to estimate the number of tokens in a given text when sending it to Large Language Models (LLMs). Instead of relying on heavy dictionary-based tokenizers, `tokenfly` uses a fast, custom heuristic algorithm.

## Installation

You can install `tokenfly` using npm:

```bash
npm install tokenfly
```

## Usage

Here is a basic example of how to use `tokenfly` to estimate tokens.

```javascript
const { estimateTokens } = require('tokenfly');

const text = "Hello, world! This is a test text for estimating token count.";

// Estimate tokens
const tokens = estimateTokens(text);
console.log(`Estimated Token count: ${tokens}`);
```

## API Reference

### `estimateTokens(text, [model])`

Estimates the number of tokens for the given text using a heuristic approach.

- **Parameters:**
  - `text` *(string)*: The input text you want to estimate the token count for.
  - `model` *(string)*: (Optional) The target LLM model name (kept for backward compatibility, but current logic uses a universal heuristic).
- **Returns:**
  - *(number)*: The estimated number of tokens (rounded up). Returns `0` if the input is invalid or an error occurs.

## How it works (Heuristics)
To keep the package extremely lightweight without downloading large vocabulary files, `tokenfly` uses the following heuristics which mimic the average tokenization behavior of standard LLMs:
- **CJK Characters (Chinese, Japanese, Korean):** ~1.5 tokens per character
- **English Words / Numbers:** ~1.3 tokens per word
- **Punctuation & Others:** ~1.0 token per character
