import type { Category, Classification, Priority } from "@/lib/validation/review";

const keywordRules: Array<{
  category: Category;
  words: string[];
}> = [
  { category: "billing", words: ["invoice", "billing", "charged", "refund", "payment", "receipt"] },
  { category: "technical_issue", words: ["bug", "error", "broken", "crash", "login failed", "not working"] },
  { category: "account", words: ["password", "account", "profile", "sign in", "email change"] },
  { category: "feature_request", words: ["feature", "request", "could you add", "would like", "integration"] },
  { category: "complaint", words: ["angry", "unhappy", "terrible", "cancel", "complaint", "disappointed"] },
  { category: "sales", words: ["pricing", "demo", "quote", "enterprise", "trial", "buy"] },
  { category: "spam", words: ["crypto", "seo backlinks", "winner", "click here", "limited offer"] },
];

export function classifyWithRules(message: string): Classification {
  const normalized = message.toLowerCase();
  const matchedRule = keywordRules.find((rule) =>
    rule.words.some((word) => normalized.includes(word)),
  );

  const category = matchedRule?.category ?? "other";
  const priority = getPriority(normalized, category);
  const confidence = matchedRule ? 0.76 : 0.54;
  const summary = buildSummary(message, category);

  return {
    category,
    priority,
    confidence,
    summary,
    suggestedReply: buildSuggestedReply(category, priority),
    reasoning: matchedRule
      ? `Matched ${category.replace("_", " ")} keywords in the message.`
      : "No strong keyword signal was found, so the message was classified as other.",
  };
}

function getPriority(normalized: string, category: Category): Priority {
  if (/\burgent\b|\basap\b|\bimmediately\b|\bcritical\b|\bdown\b/.test(normalized)) {
    return "urgent";
  }

  if (
    /\bcancel\b|\brefund\b|\bangry\b|\bescalate\b|\bsecurity\b/.test(normalized) ||
    category === "complaint"
  ) {
    return "high";
  }

  if (category === "technical_issue" || category === "billing" || category === "sales") {
    return "medium";
  }

  return "low";
}

function buildSummary(message: string, category: Category) {
  const compact = message.replace(/\s+/g, " ").trim();
  const excerpt = compact.length > 120 ? `${compact.slice(0, 117)}...` : compact;

  return `${labelForCategory(category)} message: ${excerpt}`;
}

function buildSuggestedReply(category: Category, priority: Priority) {
  const urgencyLine =
    priority === "urgent" || priority === "high"
      ? " We will prioritize this and follow up as soon as possible."
      : "";

  switch (category) {
    case "billing":
      return `Thanks for reaching out about billing. We are reviewing the account details and will confirm the next step shortly.${urgencyLine}`;
    case "technical_issue":
      return `Thanks for reporting this. Could you share any screenshots, error messages, and the steps that led to the issue?${urgencyLine}`;
    case "account":
      return `Thanks for contacting us. We can help with the account request after verifying the relevant account details.`;
    case "feature_request":
      return `Thanks for the suggestion. We will share this with the product team for review.`;
    case "complaint":
      return `Thank you for being candid. We are sorry for the poor experience and will review what happened.${urgencyLine}`;
    case "sales":
      return `Thanks for your interest. We can help with pricing, fit, and next steps for your team.`;
    case "spam":
      return `No customer reply is recommended.`;
    case "other":
      return `Thanks for the message. We will review it and route it to the right person.`;
  }
}

function labelForCategory(category: Category) {
  return category.replace("_", " ");
}
