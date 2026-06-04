#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { estimateTokens } = require('../index');

/**
 * 简单的 CLI 命令行参数解析和执行逻辑
 * 支持命令: tokenfly -count <file.md> 或 tokenfly <file.md>
 */
function run() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("Usage: tokenfly -count <file.md>");
    process.exit(1);
  }

  let filePath = null;

  // 简单的参数解析，支持 `-count` 标志
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-count') {
      if (i + 1 < args.length && !args[i+1].startsWith('-')) {
        filePath = args[i + 1];
        i++; // 跳过下一个参数，因为它是文件路径
      }
    } else if (!filePath && !args[i].startsWith('-')) {
      filePath = args[i]; // 回退处理，支持用户直接传入文件: tokenfly file.md
    }
  }

  if (!filePath) {
    console.error("Error: No file specified. Usage: tokenfly -count <file.md>");
    process.exit(1);
  }

  // Resolve absolute path
  const absolutePath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File not found at ${absolutePath}`);
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(absolutePath, 'utf8');
    const tokenCount = estimateTokens(content);
    console.log(`File: ${filePath}`);
    console.log(`Estimated Token Count: ${tokenCount}`);
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
    process.exit(1);
  }
}

run();
