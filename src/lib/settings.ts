import { getDb } from "./db";
import { isSummaryModel, isSummarySettings, type SummarySettings } from "./summary-settings";

const glossaryKey = "glossary";
const summarySettingsKey = "summary_generation";

export function getSummarySettings(): SummarySettings {
  const row = getDb()
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(summarySettingsKey) as { value: string } | undefined;
  if (row) {
    try {
      const parsed: unknown = JSON.parse(row.value);
      if (isSummarySettings(parsed)) return parsed;
    } catch {}
  }
  const model = process.env.OPENAI_SUMMARY_MODEL;
  return { model: isSummaryModel(model) ? model : "gpt-5.6-sol", reasoningEffort: "high" };
}

export function setSummarySettings(settings: SummarySettings): void {
  if (!isSummarySettings(settings)) {
    throw new Error("노트 생성 모델과 추론 수준을 확인해 주세요.");
  }
  getDb()
    .prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    )
    .run(
      summarySettingsKey,
      JSON.stringify({ model: settings.model, reasoningEffort: settings.reasoningEffort }),
    );
}

export function getGlossary(): string[] {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(glossaryKey) as
    | { value: string }
    | undefined;
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

export function setGlossary(terms: string[]): void {
  const unique = Array.from(new Set(terms.map((t) => t.trim()).filter(Boolean)));
  getDb()
    .prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    )
    .run(glossaryKey, JSON.stringify(unique));
}
