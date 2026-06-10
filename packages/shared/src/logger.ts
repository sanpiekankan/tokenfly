/**
 * Describes the minimum logger interface that tokenfly modules rely on.
 */
export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

/**
 * Creates a console-based logger implementation for local development and CLI usage.
 *
 * @returns A logger that writes structured messages to the console.
 */
export function createConsoleLogger(): Logger {
  const write = (
    level: "debug" | "info" | "warn" | "error",
    message: string,
    context?: Record<string, unknown>
  ): void => {
    const payload = context ? ` ${JSON.stringify(context)}` : "";
    console[level](`[tokenfly] ${message}${payload}`);
  };

  return {
    debug: (message, context) => write("debug", message, context),
    info: (message, context) => write("info", message, context),
    warn: (message, context) => write("warn", message, context),
    error: (message, context) => write("error", message, context)
  };
}
