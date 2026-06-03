/**
 * 估算给定文本在发送给大模型时所占用的 Token 数量。
 * 这是一个基于启发式规则的自定义估算逻辑，实现了零依赖，无需下载庞大的外部词表库。
 * 
 * 估算规则启发式权重（参考主流模型的平均切词行为）：
 * - 1 个中日韩（CJK）字符 ≈ 1.5 个 Token
 * - 1 个英文单词/数字组合 ≈ 1.3 个 Token
 * - 1 个标点符号/其他字符 ≈ 1 个 Token
 * 
 * @param {string} text - 需要估算 Token 数量的输入文本。
 * @param {string} [model] - 目标大模型名称（为保持向后兼容保留，当前逻辑中统一采用通用估算）。
 * @returns {number} 估算出的 Token 数量（向上取整）。如果输入不合法或发生错误，返回 0。
 */
function estimateTokens(text, model = "gpt-4") {
  if (typeof text !== "string" || text.trim() === "") {
    return 0;
  }

  try {
    // 匹配中日韩字符 (汉字、日文假名、韩文等)
    const cjkRegex = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g;
    // 匹配英文单词和连续数字
    const wordRegex = /[a-zA-Z0-9]+/g;
    // 匹配标点符号及其他非空白、非字母数字、非中日韩字符
    const puncRegex = /[^\w\s\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g;

    const cjkCount = (text.match(cjkRegex) || []).length;
    const wordCount = (text.match(wordRegex) || []).length;
    const puncCount = (text.match(puncRegex) || []).length;

    // 启发式加权计算
    const estimated = (cjkCount * 1.5) + (wordCount * 1.3) + (puncCount * 1.0);
    
    return Math.ceil(estimated);
  } catch (error) {
    console.error(`[tokenfly] Error estimating tokens:`, error.message);
    return 0;
  }
}

module.exports = {
  estimateTokens
};
