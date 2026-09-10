export const summaryModels = ["gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna"] as const;
export const summaryReasoningEfforts = ["low", "medium", "high", "xhigh"] as const;

export type SummarySettings = {
  model: (typeof summaryModels)[number];
  reasoningEffort: (typeof summaryReasoningEfforts)[number];
};

export function isSummaryModel(value: unknown): value is SummarySettings["model"] {
  return summaryModels.some((model) => model === value);
}

export function isSummarySettings(value: unknown): value is SummarySettings {
  return (
    typeof value === "object" &&
    value !== null &&
    "model" in value &&
    isSummaryModel(value.model) &&
    "reasoningEffort" in value &&
    summaryReasoningEfforts.some((effort) => effort === value.reasoningEffort)
  );
}
