import { getDb } from "./db";

const glossaryKey = "glossary";

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
