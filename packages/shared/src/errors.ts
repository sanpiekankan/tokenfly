/**
 * Represents a structured application error that can be shared across modules.
 */
export class TokenflyError extends Error {
  code: string;
  details?: unknown;

  /**
   * Creates a new structured tokenfly error.
   *
   * @param code - A stable machine-readable error code.
   * @param message - A human-readable error message.
   * @param details - Optional contextual details for debugging.
   */
  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "TokenflyError";
    this.code = code;
    this.details = details;
  }
}
