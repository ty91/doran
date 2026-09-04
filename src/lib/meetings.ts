import { getDb } from "./db";
import type {
  Meeting,
  MeetingListItem,
  SummaryStatus,
  SummaryVersion,
  TranscriptionProgress,
  TranscriptionStatus,
} from "./types";

type MeetingRow = {
  id: string;
  title: string;
  meeting_date: string;
  participants: string;
  audio_file_name: string;
  audio_stored_name: string;
  audio_mime_type: string;
  audio_size: number;
  transcript: string | null;
  transcription_status: TranscriptionStatus;
  transcription_error: string | null;
  transcription_progress: string | null;
  summary: string | null;
  summary_status: SummaryStatus;
  summary_error: string | null;
  created_at: string;
  updated_at: string;
};

function parseParticipants(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((p) => typeof p === "string") : [];
  } catch {
    return [];
  }
}

function parseProgress(raw: string | null): TranscriptionProgress | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.done === "number" && typeof parsed?.total === "number") {
      return { done: parsed.done, total: parsed.total };
    }
    return null;
  } catch {
    return null;
  }
}

function toMeeting(row: MeetingRow): Meeting {
  return {
    id: row.id,
    title: row.title,
    date: row.meeting_date,
    participants: parseParticipants(row.participants),
    audio: {
      fileName: row.audio_file_name,
      storedName: row.audio_stored_name,
      mimeType: row.audio_mime_type,
      size: row.audio_size,
    },
    transcript: row.transcript,
    transcription: {
      status: row.transcription_status,
      error: row.transcription_error,
      progress: parseProgress(row.transcription_progress),
    },
    summary: row.summary,
    summarization: {
      status: row.summary_status,
      error: row.summary_error,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listMeetings(): MeetingListItem[] {
  const rows = getDb()
    .prepare(
      "SELECT id, title, meeting_date, participants, transcription_status, transcription_error, transcription_progress, created_at FROM meetings ORDER BY meeting_date DESC, created_at DESC",
    )
    .all() as Array<
    Pick<
      MeetingRow,
      | "id"
      | "title"
      | "meeting_date"
      | "participants"
      | "transcription_status"
      | "transcription_error"
      | "transcription_progress"
      | "created_at"
    >
  >;
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    date: row.meeting_date,
    participants: parseParticipants(row.participants),
    transcription: {
      status: row.transcription_status,
      error: row.transcription_error,
      progress: parseProgress(row.transcription_progress),
    },
    createdAt: row.created_at,
  }));
}

export function getMeeting(id: string): Meeting | null {
  const row = getDb().prepare("SELECT * FROM meetings WHERE id = ?").get(id) as
    | MeetingRow
    | undefined;
  return row ? toMeeting(row) : null;
}

export type CreateMeetingInput = {
  id: string;
  title: string;
  date: string;
  audio: Meeting["audio"];
};

export function createMeeting(input: CreateMeetingInput): Meeting {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO meetings (
        id, title, meeting_date, participants,
        audio_file_name, audio_stored_name, audio_mime_type, audio_size,
        transcription_status, created_at, updated_at
      ) VALUES (?, ?, ?, '[]', ?, ?, ?, ?, 'pending', ?, ?)`,
    )
    .run(
      input.id,
      input.title,
      input.date,
      input.audio.fileName,
      input.audio.storedName,
      input.audio.mimeType,
      input.audio.size,
      now,
      now,
    );
  return getMeeting(input.id) as Meeting;
}

export type UpdateMeetingInput = Partial<Pick<Meeting, "title" | "date" | "participants">>;

export function updateMeeting(id: string, input: UpdateMeetingInput): Meeting | null {
  const sets: string[] = [];
  const values: Array<string> = [];
  if (input.title !== undefined) {
    sets.push("title = ?");
    values.push(input.title);
  }
  if (input.date !== undefined) {
    sets.push("meeting_date = ?");
    values.push(input.date);
  }
  if (input.participants !== undefined) {
    sets.push("participants = ?");
    values.push(JSON.stringify(input.participants));
  }
  if (sets.length === 0) return getMeeting(id);
  sets.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);
  getDb()
    .prepare(`UPDATE meetings SET ${sets.join(", ")} WHERE id = ?`)
    .run(...values);
  return getMeeting(id);
}

export function setTranscriptionStatus(
  id: string,
  status: TranscriptionStatus,
  error: string | null = null,
): void {
  getDb()
    .prepare(
      "UPDATE meetings SET transcription_status = ?, transcription_error = ?, transcription_progress = NULL, updated_at = ? WHERE id = ?",
    )
    .run(status, error, new Date().toISOString(), id);
}

export function setTranscriptionProgress(id: string, progress: TranscriptionProgress | null): void {
  getDb()
    .prepare("UPDATE meetings SET transcription_progress = ?, updated_at = ? WHERE id = ?")
    .run(progress ? JSON.stringify(progress) : null, new Date().toISOString(), id);
}

export function setTranscript(id: string, transcript: string): void {
  getDb()
    .prepare(
      "UPDATE meetings SET transcript = ?, transcription_status = 'done', transcription_error = NULL, updated_at = ? WHERE id = ?",
    )
    .run(transcript, new Date().toISOString(), id);
}

export function setSummaryStatus(
  id: string,
  status: SummaryStatus,
  error: string | null = null,
): void {
  getDb()
    .prepare(
      "UPDATE meetings SET summary_status = ?, summary_error = ?, updated_at = ? WHERE id = ?",
    )
    .run(status, error, new Date().toISOString(), id);
}

export function addSummaryVersion(id: string, content: string, model: string): SummaryVersion {
  const db = getDb();
  const now = new Date().toISOString();
  db.exec("BEGIN");
  try {
    const row = db
      .prepare(
        "SELECT COALESCE(MAX(version), 0) + 1 AS next FROM summary_versions WHERE meeting_id = ?",
      )
      .get(id) as { next: number };
    db.prepare(
      "INSERT INTO summary_versions (meeting_id, version, content, model, created_at) VALUES (?, ?, ?, ?, ?)",
    ).run(id, row.next, content, model, now);
    db.prepare(
      "UPDATE meetings SET summary = ?, summary_status = 'done', summary_error = NULL, updated_at = ? WHERE id = ?",
    ).run(content, now, id);
    db.exec("COMMIT");
    return { version: row.next, model, createdAt: now };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function listSummaryVersions(id: string): SummaryVersion[] {
  const rows = getDb()
    .prepare(
      "SELECT version, model, created_at FROM summary_versions WHERE meeting_id = ? ORDER BY version DESC",
    )
    .all(id) as Array<{ version: number; model: string | null; created_at: string }>;
  return rows.map((row) => ({ version: row.version, model: row.model, createdAt: row.created_at }));
}

export function getSummaryVersionContent(id: string, version: number): string | null {
  const row = getDb()
    .prepare("SELECT content FROM summary_versions WHERE meeting_id = ? AND version = ?")
    .get(id, version) as { content: string } | undefined;
  return row?.content ?? null;
}

export function deleteMeeting(id: string): Meeting | null {
  const meeting = getMeeting(id);
  if (!meeting) return null;
  getDb().prepare("DELETE FROM meetings WHERE id = ?").run(id);
  return meeting;
}
