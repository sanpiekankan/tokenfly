import { TokenflyError } from "@tokenfly/shared";
import type { ModelPricing } from "./types";

export const DEFAULT_MODEL_PRICING: Record<string, ModelPricing> = {
  "gpt-4": {
    model: "gpt-4",
    provider: "openai",
    inputPricePer1k: 0.03,
    outputPricePer1k: 0.06,
    contextWindow: 8192
  },
  "gpt-3.5-turbo": {
    model: "gpt-3.5-turbo",
    provider: "openai",
    inputPricePer1k: 0.0005,
    outputPricePer1k: 0.0015,
    contextWindow: 16385
  }
};

/**
 * Resolves model pricing from a registry and throws a structured error when missing.
 *
 * @param model - The model identifier to resolve.
 * @param registry - Optional custom registry that can override the defaults.
 * @returns The pricing record for the requested model.
 */
export function getModelPricing(
  model: string,
  registry: Record<string, ModelPricing> = DEFAULT_MODEL_PRICING
): ModelPricing {
  const modelPricing = registry[model];

  if (!modelPricing) {
    throw new TokenflyError(
      "MODEL_PRICING_NOT_FOUND",
      `No pricing configuration was found for model "${model}".`,
      { model }
    );
  }

  return modelPricing;
}
