/**
 * Represents a lightweight metrics sink that can be implemented by CLI, SDK, or gateways.
 */
export interface MetricsSink {
  increment(name: string, value?: number, tags?: Record<string, string>): void;
  observe(name: string, value: number, tags?: Record<string, string>): void;
}

/**
 * Creates a no-op metrics sink for environments where metrics are optional.
 *
 * @returns A metrics sink that silently ignores all calls.
 */
export function createNoopMetricsSink(): MetricsSink {
  return {
    increment: () => undefined,
    observe: () => undefined
  };
}
