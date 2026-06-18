function asBoolean(value: string | undefined, fallback = false): boolean {
  if (!value) return fallback;
  return value === "1" || value.toLowerCase() === "true";
}

export const featureFlags = {
  aiSemanticSearch: asBoolean(import.meta.env.VITE_FEATURE_AI_SEMANTIC_SEARCH, false),
  askYourLifeChat: asBoolean(import.meta.env.VITE_FEATURE_ASK_YOUR_LIFE_CHAT, false),
  aiInsights: asBoolean(import.meta.env.VITE_FEATURE_AI_INSIGHTS, false),
  familySharing: asBoolean(import.meta.env.VITE_FEATURE_FAMILY_SHARING, false),
} as const;

export const AI_GROUNDING_POLICY =
  "AI responses must be grounded in retrieved user memory records. If supporting memories are missing or weak, return a no-answer response.";
