import { ClassificationSchema, type Classification } from "@/lib/validation/review";

export function parseStrictClassificationJson(rawText: string): Classification {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("Provider returned invalid JSON.");
  }

  const result = ClassificationSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error("Provider returned JSON that does not match the classification schema.");
  }

  return result.data;
}
