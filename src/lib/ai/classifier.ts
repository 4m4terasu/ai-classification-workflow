import { classifyWithRules } from "@/lib/ai/mock-provider";
import { GeminiProvider, OpenAiProvider, type ProviderName } from "@/lib/ai/providers";
import type { Classification } from "@/lib/validation/review";

export interface ClassificationResult {
  classification: Classification;
  provider: ProviderName;
  warnings: string[];
}

const providers = [new GeminiProvider(), new OpenAiProvider()];

export async function classifyMessage(message: string): Promise<ClassificationResult> {
  const warnings: string[] = [];

  // Provider fallback behavior:
  // 1. Try Gemini when GEMINI_API_KEY exists.
  // 2. Try OpenAI when OPENAI_API_KEY exists.
  // 3. If keys are missing, network calls fail, or strict JSON validation fails,
  //    use the deterministic local classifier so the app always works in development.
  for (const provider of providers) {
    if (!provider.isConfigured()) {
      warnings.push(`${provider.name} skipped: API key is not configured.`);
      continue;
    }

    try {
      return {
        classification: await provider.classify(message),
        provider: provider.name,
        warnings,
      };
    } catch (error) {
      warnings.push(
        `${provider.name} failed: ${
          error instanceof Error ? error.message : "Unknown provider error."
        }`,
      );
    }
  }

  return {
    classification: classifyWithRules(message),
    provider: "rules",
    warnings,
  };
}
