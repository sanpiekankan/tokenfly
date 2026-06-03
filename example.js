const { estimateTokens } = require('./index');

const text = "Hello, world! This is a test text for estimating token count.";

// Estimate tokens for the default model (gpt-4)
const tokensGpt4 = estimateTokens(text);
console.log(`Token count (gpt-4): ${tokensGpt4}`);

// Estimate tokens for a specific model (e.g., gpt-3.5-turbo)
const tokensGpt35 = estimateTokens(text, "gpt-3.5-turbo");
console.log(`Token count (gpt-3.5-turbo): ${tokensGpt35}`);
