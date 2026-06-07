# tokenfly

A lightweight, **zero-dependency** npm package to estimate the number of tokens in a given text when sending it to Large Language Models (LLMs). Instead of relying on heavy dictionary-based tokenizers, `tokenfly` uses a fast, custom heuristic algorithm.

## Installation

You can install `tokenfly` locally in your project:

```bash
npm install tokenfly
```

To use the CLI tool globally from anywhere, install it globally:

```bash
npm install -g tokenfly
```

## Usage

### CLI Usage (Command Line)

You can estimate the tokens of a file (e.g., a Markdown prompt file, text file, etc.) directly from your terminal.

If installed globally, simply run:

```bash
tokenfly prompt.md

# Or using the -count flag
tokenfly -count prompt.md
```

**Zero-install with npx:**
If you don't want to install it globally, you can run it directly using `npx`:

```bash
npx tokenfly prompt.md
```

**Output Example:**
```
File: prompt.md
Estimated Token Count: 168
```

### Programmatic Usage

You can use `tokenfly` programmatically in Node.js. It supports both CommonJS and ES Modules.

**CommonJS:**
```javascript
const { estimateTokens } = require('tokenfly');

const text = "Hello, world! This is a test text for estimating token count.";
const tokens = estimateTokens(text);

console.log(`Estimated Token count: ${tokens}`);
```

**ES Modules:**
```javascript
import { estimateTokens } from 'tokenfly';

const text = "Hello, world! This is a test text for estimating token count.";
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
