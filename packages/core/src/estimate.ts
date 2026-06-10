import type { TokenEstimateResult } from "./types";

const CJK_REGEX = /[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g;
const WORD_REGEX = /[a-zA-Z]+(?:'[a-zA-Z]+)?|\d+(?:\.\d+)?/g;
const PUNCTUATION_REGEX = /[^\w\s\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g;

/**
 * Estimates token usage for plain text by applying a deterministic heuristic strategy.
 *
 * @param text - The plain text content to analyze.
 * @param model - The target model identifier for reporting purposes.
 * @returns A structured token estimate result.
 */
export function estimateTokens(
  text: string,
  model = "gpt-4"
): TokenEstimateResult {
  if (typeof text !== "string" || text.trim() === "") {
    return {
      tokenCount: 0,
      method: "heuristic-v1",
      model
    };
  }

  const cjkCount = (text.match(CJK_REGEX) ?? []).length;
  const wordCount = (text.match(WORD_REGEX) ?? []).length;
  const punctuationCount = (text.match(PUNCTUATION_REGEX) ?? []).length;

  const tokenCount = Math.ceil(
    cjkCount * 1.5 + wordCount * 1.3 + punctuationCount
  );

  return {
    tokenCount,
    method: "heuristic-v1",
    model
  };
}

/**
 * Estimates token usage for file content that has already been loaded into memory.
 *
 * @param fileContent - The textual file content to analyze.
 * @param model - The target model identifier for reporting purposes.
 * @returns A structured token estimate result.
 */
export function estimateFileContentTokens(
  fileContent: string,
  model = "gpt-4"
): TokenEstimateResult {
  return estimateTokens(fileContent, model);
}
