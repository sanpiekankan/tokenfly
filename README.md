# tokenfly

A lightweight npm package to estimate the number of tokens in a given text when sending it to Large Language Models (LLMs). It uses the official `tiktoken` library for accurate token encoding estimation.

## Installation

You can install `tokenfly` using npm:

```bash
npm install tokenfly
```

## Usage

Here is a basic example of how to use `tokenfly` to estimate tokens for different models.

```javascript
const { estimateTokens } = require('tokenfly');

const text = "Hello, world! This is a test text for estimating token count.";

// Estimate tokens for the default model (gpt-4)
const tokensGpt4 = estimateTokens(text);
console.log(`Token count (gpt-4): ${tokensGpt4}`);

// Estimate tokens for a specific model (e.g., gpt-3.5-turbo)
const tokensGpt35 = estimateTokens(text, "gpt-3.5-turbo");
console.log(`Token count (gpt-3.5-turbo): ${tokensGpt35}`);
```

## API Reference

### `estimateTokens(text, [model])`

Estimates the number of tokens for the given text.

- **Parameters:**
  - `text` *(string)*: The input text you want to estimate the token count for.
  - `model` *(string)*: (Optional) The target LLM model name. Defaults to `"gpt-4"`.
- **Returns:**
  - *(number)*: The estimated number of tokens. Returns `0` if the input is invalid or an error occurs.

## Supported Models
`tokenfly` relies on `tiktoken` under the hood. It supports standard OpenAI models such as:
- `gpt-4` (default)
- `gpt-3.5-turbo`
- `text-embedding-ada-002`
- and more...
