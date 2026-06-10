import { describe, expect, it, vi } from "vitest";
import {
  TokenflyError,
  createConsoleLogger,
  createNoopMetricsSink,
  mergeConfig
} from "../src";

describe("@tokenfly/shared", () => {
  it("merges runtime overrides into the default configuration", () => {
    const result = mergeConfig(
      { model: "gpt-4", budget: 0.01 },
      { budget: 0.02 }
    );

    expect(result).toEqual({ model: "gpt-4", budget: 0.02 });
  });

  it("creates a structured TokenflyError", () => {
    const error = new TokenflyError("TEST_ERROR", "Structured failure", {
      scope: "shared"
    });

    expect(error.name).toBe("TokenflyError");
    expect(error.code).toBe("TEST_ERROR");
    expect(error.details).toEqual({ scope: "shared" });
  });

  it("creates callable logger and metrics helpers", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const logger = createConsoleLogger();
    const metrics = createNoopMetricsSink();

    logger.info("Logger works", { module: "shared" });
    metrics.increment("tokenfly.test");
    metrics.observe("tokenfly.duration", 10);

    expect(infoSpy).toHaveBeenCalledTimes(1);

    infoSpy.mockRestore();
  });
});
