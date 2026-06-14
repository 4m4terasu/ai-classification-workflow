import { parseStrictClassificationJson } from "@/lib/ai/strict-json";
import { buildClassificationPrompt } from "@/lib/ai/prompt";
import type { Classification } from "@/lib/validation/review";

export type ProviderName = "gemini" | "openai" | "rules";

export interface ClassificationProvider {
  name: ProviderName;
  isConfigured(): boolean;
  classify(message: string): Promise<Classification>;
}

export class GeminiProvider implements ClassificationProvider {
  name: ProviderName = "gemini";

  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  async classify(message: string) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: buildClassificationPrompt(message) }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed with ${response.status}.`);
    }

    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    return parseStrictClassificationJson(text);
  }
}

export class OpenAiProvider implements ClassificationProvider {
  name: ProviderName = "openai";

  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  async classify(message: string) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You classify customer messages. Return only strict JSON that matches the requested schema.",
          },
          {
            role: "user",
            content: buildClassificationPrompt(message),
          },
        ],
        temperature: 0.1,
        text: {
          format: {
            type: "json_object",
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with ${response.status}.`);
    }

    const payload = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
    };
    const text = payload.output_text ?? payload.output?.[0]?.content?.[0]?.text;

    if (!text) {
      throw new Error("OpenAI returned an empty response.");
    }

    return parseStrictClassificationJson(text);
  }
}
