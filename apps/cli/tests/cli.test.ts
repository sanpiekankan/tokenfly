import { describe, expect, it } from "vitest";
import { executeCli, getHelpText, parseArgs } from "../src/cli";

describe("tokenfly CLI", () => {
  it("parses direct file input", () => {
    const result = parseArgs(["prompt.md", "--model", "gpt-3.5-turbo"]);

    expect(result.filePath).toBe("prompt.md");
    expect(result.model).toBe("gpt-3.5-turbo");
  });

  it("parses text mode and json mode", () => {
    const result = parseArgs(["--text", "hello world", "--json"]);

    expect(result.text).toBe("hello world");
    expect(result.json).toBe(true);
  });

  it("returns a command result for inline text", () => {
    const result = executeCli(["--text", "hello world", "--model", "gpt-4"]);

    expect(result.model).toBe("gpt-4");
    expect(result.tokenCount).toBeGreaterThan(0);
    expect(result.estimatedCost).toBeGreaterThan(0);
  });

  it("returns help output", () => {
    expect(getHelpText()).toContain("Usage:");
    expect(getHelpText()).toContain("--json");
  });
});
