const { encoding_for_model } = require("tiktoken");

/**
 * 估算给定文本在发送给大模型时所占用的 Token 数量。
 * 默认使用 'gpt-4' 模型的编码方式 (cl100k_base)。
 * 
 * @param {string} text - 需要估算 Token 数量的输入文本。
 * @param {string} [model="gpt-4"] - 目标大模型名称，默认值为 "gpt-4"。
 * @returns {number} 估算出的 Token 数量。如果发生错误，返回 0。
 */
function estimateTokens(text, model = "gpt-4") {
  if (typeof text !== "string" || text.trim() === "") {
    return 0;
  }

  try {
    const enc = encoding_for_model(model);
    const tokens = enc.encode(text);
    enc.free(); // 释放内存
    return tokens.length;
  } catch (error) {
    console.error(`[tokenfly] Error estimating tokens for model ${model}:`, error.message);
    return 0;
  }
}

module.exports = {
  estimateTokens
};
