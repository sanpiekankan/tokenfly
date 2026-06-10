#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import {
  checkBudget,
  estimateCost,
  estimateFileContentTokens,
  estimateTokens,
  getModelPricing
} from "@tokenfly/core";
import { TokenflyError } from "@tokenfly/shared";

interface ParsedCliArgs {
  filePath?: string;
  text?: string;
  model: string;
  outputTokens: number;
  budgetLimit?: number;
  json: boolean;
  help: boolean;
}

interface CommandResult {
  file?: string;
  model: string;
  tokenCount: number;
  estimatedCost: number;
  budgetStatus?: string;
  budgetReason?: string;
}

/**
 * Parses CLI arguments into a normalized command object.
 *
 * @param args - Raw process arguments excluding the node executable and script path.
 * @returns A normalized CLI command configuration.
 */
export function parseArgs(args: string[]): ParsedCliArgs {
  const parsed: ParsedCliArgs = {
    model: "gpt-4",
    outputTokens: 0,
    json: false,
    help: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];
    const next = args[index + 1];

    if (current === "--help" || current === "-h") {
      parsed.help = true;
      continue;
    }

    if (current === "--json") {
      parsed.json = true;
      continue;
    }

    if (current === "--model") {
      if (!next) {
        throw new TokenflyError(
          "CLI_INVALID_ARGUMENT",
          "The --model option requires a value."
        );
      }

      parsed.model = next;
      index += 1;
      continue;
    }

    if (current === "--text") {
      if (!next) {
        throw new TokenflyError(
          "CLI_INVALID_ARGUMENT",
          "The --text option requires a value."
        );
      }

      parsed.text = next;
      index += 1;
      continue;
    }

    if (current === "--output-tokens") {
      if (!next || Number.isNaN(Number(next))) {
        throw new TokenflyError(
          "CLI_INVALID_ARGUMENT",
          "The --output-tokens option requires a numeric value."
        );
      }

      parsed.outputTokens = Number(next);
      index += 1;
      continue;
    }

    if (current === "--budget") {
      if (!next || Number.isNaN(Number(next))) {
        throw new TokenflyError(
          "CLI_INVALID_ARGUMENT",
          "The --budget option requires a numeric value."
        );
      }

      parsed.budgetLimit = Number(next);
      index += 1;
      continue;
    }

    if (current === "-count") {
      if (!next) {
        throw new TokenflyError(
          "CLI_INVALID_ARGUMENT",
          "The -count option requires a file path."
        );
      }

      parsed.filePath = next;
      index += 1;
      continue;
    }

    if (!current.startsWith("-") && !parsed.filePath && !parsed.text) {
      parsed.filePath = current;
      continue;
    }

    throw new TokenflyError(
      "CLI_INVALID_ARGUMENT",
      `Unknown argument "${current}".`
    );
  }

  return parsed;
}

/**
 * Formats the default help output for the tokenfly CLI.
 *
 * @returns The human-readable help text.
 */
export function getHelpText(): string {
  return [
    "Usage:",
    "  tokenfly <file>",
    "  tokenfly -count <file>",
    '  tokenfly --text "your prompt text"',
    "",
    "Options:",
    "  --model <name>          Select the target model for reporting.",
    "  --output-tokens <num>   Include estimated output cost in the response.",
    "  --budget <usd>          Check the estimate against a budget limit.",
    "  --json                  Return machine-readable JSON output.",
    "  --help, -h              Show this help message."
  ].join("\n");
}

/**
 * Executes the CLI command from parsed arguments and returns a structured result.
 *
 * @param args - Raw process arguments excluding the node executable and script path.
 * @returns A structured command result ready for rendering.
 */
export function executeCli(args: string[]): CommandResult {
  const parsed = parseArgs(args);

  if (parsed.help) {
    throw new TokenflyError("CLI_HELP", getHelpText());
  }

  if (!parsed.filePath && !parsed.text) {
    throw new TokenflyError(
      "CLI_INVALID_ARGUMENT",
      "No input was provided. Use a file path or --text."
    );
  }

  const content = parsed.text ?? readFileContent(parsed.filePath!);
  const tokenResult = parsed.text
    ? estimateTokens(content, parsed.model)
    : estimateFileContentTokens(content, parsed.model);

  const modelPricing = getModelPricing(parsed.model);
  const costEstimate = estimateCost({
    modelPricing,
    inputTokens: tokenResult.tokenCount,
    outputTokens: parsed.outputTokens
  });

  const result: CommandResult = {
    file: parsed.filePath,
    model: parsed.model,
    tokenCount: tokenResult.tokenCount,
    estimatedCost: costEstimate.totalCost
  };

  if (typeof parsed.budgetLimit === "number") {
    const budgetResult = checkBudget({
      budgetLimit: parsed.budgetLimit,
      estimatedCost: costEstimate.totalCost
    });

    result.budgetStatus = budgetResult.status;
    result.budgetReason = budgetResult.reason;
  }

  return result;
}

/**
 * Reads UTF-8 text from a file path and throws a structured error when unavailable.
 *
 * @param filePath - The path provided by the CLI user.
 * @returns The file content as UTF-8 text.
 */
export function readFileContent(filePath: string): string {
  const absolutePath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new TokenflyError(
      "CLI_FILE_NOT_FOUND",
      `File not found at ${absolutePath}.`,
      { filePath: absolutePath }
    );
  }

  return fs.readFileSync(absolutePath, "utf8");
}

/**
 * Renders a CLI command result to stdout using either text or JSON output.
 *
 * @param result - The command result to display.
 * @param json - Whether JSON output was requested.
 */
export function printResult(result: CommandResult, json: boolean): void {
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  if (result.file) {
    process.stdout.write(`File: ${result.file}\n`);
  }

  process.stdout.write(`Model: ${result.model}\n`);
  process.stdout.write(`Estimated Token Count: ${result.tokenCount}\n`);
  process.stdout.write(`Estimated Cost (USD): ${result.estimatedCost}\n`);

  if (result.budgetStatus) {
    process.stdout.write(`Budget Status: ${result.budgetStatus}\n`);
  }

  if (result.budgetReason) {
    process.stdout.write(`Budget Reason: ${result.budgetReason}\n`);
  }
}

/**
 * Runs the tokenfly CLI and maps structured errors to stable exit codes.
 */
export function runCli(): void {
  try {
    const parsed = parseArgs(process.argv.slice(2));

    if (parsed.help) {
      process.stdout.write(`${getHelpText()}\n`);
      process.exit(0);
    }

    const result = executeCli(process.argv.slice(2));
    printResult(result, parsed.json);
    process.exit(0);
  } catch (error: unknown) {
    if (error instanceof TokenflyError) {
      const exitCode =
        error.code === "CLI_INVALID_ARGUMENT"
          ? 1
          : error.code === "CLI_FILE_NOT_FOUND"
            ? 2
            : 3;

      process.stderr.write(`${error.message}\n`);
      process.exit(exitCode);
    }

    const message =
      error instanceof Error ? error.message : "Unexpected CLI runtime error.";
    process.stderr.write(`${message}\n`);
    process.exit(3);
  }
}
