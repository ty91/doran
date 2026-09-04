import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { audioDir, dataDir, databasePath } from "./paths";

const schema = `
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  meeting_date TEXT NOT NULL,
  participants TEXT NOT NULL DEFAULT '[]',
  audio_file_name TEXT NOT NULL,
  audio_stored_name TEXT NOT NULL,
  audio_mime_type TEXT NOT NULL,
  audio_size INTEGER NOT NULL,
  transcript TEXT,
  transcription_status TEXT NOT NULL DEFAULT 'pending',
  transcription_error TEXT,
  transcription_progress TEXT,
  summary TEXT,
  summary_status TEXT NOT NULL DEFAULT 'idle',
  summary_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS meetings_date_idx ON meetings (meeting_date DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS summary_versions (
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  model TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (meeting_id, version)
);
`;

function migrate(db: DatabaseSync): void {
  const columns = db.prepare("PRAGMA table_info(meetings)").all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === "transcription_progress")) {
    db.exec("ALTER TABLE meetings ADD COLUMN transcription_progress TEXT");
  }
  if (!columns.some((column) => column.name === "summary_status")) {
    db.exec("ALTER TABLE meetings ADD COLUMN summary_status TEXT NOT NULL DEFAULT 'idle'");
  }
  if (!columns.some((column) => column.name === "summary_error")) {
    db.exec("ALTER TABLE meetings ADD COLUMN summary_error TEXT");
  }
  db.exec(
    "INSERT INTO summary_versions (meeting_id, version, content, model, created_at) SELECT id, 1, summary, NULL, updated_at FROM meetings WHERE summary IS NOT NULL AND id NOT IN (SELECT meeting_id FROM summary_versions)",
  );
}

function resetInterruptedJobs(db: DatabaseSync): void {
  db.prepare(
    "UPDATE meetings SET transcription_status = 'failed', transcription_error = ?, transcription_progress = NULL WHERE transcription_status = 'transcribing'",
  ).run("서버가 재시작되어 전사가 중단되었습니다. 다시 전사를 실행해 주세요.");
  db.prepare(
    "UPDATE meetings SET summary_status = 'failed', summary_error = ? WHERE summary_status = 'generating'",
  ).run("서버가 재시작되어 노트 생성이 중단되었습니다. 다시 생성해 주세요.");
}

function openDatabase(): DatabaseSync {
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(audioDir, { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(schema);
  migrate(db);
  resetInterruptedJobs(db);
  return db;
}

const schemaVersion = 4;
const globalKey = `__doranDb_v${schemaVersion}`;
const globalForDb = globalThis as unknown as Record<string, DatabaseSync | undefined>;

export function getDb(): DatabaseSync {
  let db = globalForDb[globalKey];
  if (!db) {
    db = openDatabase();
    globalForDb[globalKey] = db;
  }
  return db;
}
