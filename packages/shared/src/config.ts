/**
 * Merges a default configuration object with optional environment and runtime overrides.
 *
 * @param defaults - The base configuration values.
 * @param runtimeOverrides - Optional overrides passed by the caller.
 * @returns A merged configuration object.
 */
export function mergeConfig<T extends Record<string, unknown>>(
  defaults: T,
  runtimeOverrides?: Partial<T>
): T {
  return {
    ...defaults,
    ...(runtimeOverrides ?? {})
  };
}
