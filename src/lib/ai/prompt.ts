export function buildClassificationPrompt(message: string) {
  return `Classify this incoming customer or business message.

Return strict JSON only. Do not include markdown, code fences, prose, comments, or trailing commas.

Allowed categories:
- billing
- technical_issue
- account
- feature_request
- complaint
- sales
- spam
- other

Allowed priorities:
- low
- medium
- high
- urgent

JSON shape:
{
  "category": "billing | technical_issue | account | feature_request | complaint | sales | spam | other",
  "priority": "low | medium | high | urgent",
  "confidence": 0.0,
  "summary": "One short sentence.",
  "suggestedReply": "A concise, helpful draft reply.",
  "reasoning": "One short internal explanation."
}

Message:
${message}`;
}
