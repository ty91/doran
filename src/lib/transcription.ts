import { readFile } from "node:fs/promises";
import path from "node:path";
import { audioPathFor } from "./audio";
import { isFfmpegAvailable, removeChunks, splitIntoChunks } from "./audio-chunks";
import {
  getMeeting,
  setTranscript,
  setTranscriptionProgress,
  setTranscriptionStatus,
} from "./meetings";

const endpoint = "https://openrouter.ai/api/v1/audio/transcriptions";
const defaultModel = "openai/gpt-transcribe";
const singleRequestLimitBytes = 25 * 1024 * 1024;
const concurrency = 3;
const maxAttempts = 3;

function config() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY 환경 변수가 설정되지 않았습니다.");
  }
  return {
    apiKey,
    model: process.env.OPENROUTER_TRANSCRIBE_MODEL || defaultModel,
    language: process.env.OPENROUTER_TRANSCRIBE_LANGUAGE || undefined,
  };
}

async function transcribeFile(filePath: string, mimeType: string): Promise<string> {
  const { apiKey, model, language } = config();
  const form = new FormData();
  form.append(
    "file",
    new Blob([await readFile(filePath)], { type: mimeType }),
    path.basename(filePath),
  );
  form.append("model", model);
  if (language) form.append("language", language);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`OpenRouter 요청 중 연결 오류: ${message}`, { cause: error });
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter 응답 오류 (${response.status}): ${body.slice(0, 500)}`);
  }
  const json = (await response.json()) as { text?: unknown };
  if (typeof json.text !== "string") {
    throw new Error("OpenRouter 응답에 전사 텍스트가 없습니다.");
  }
  return json.text.trim();
}

async function transcribeWithRetry(filePath: string, mimeType: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await transcribeFile(filePath, mimeType);
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
      }
    }
  }
  throw lastError;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = Array.from({ length: items.length });
  let next = 0;
  async function drain() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, drain));
  return results;
}

export async function runTranscription(meetingId: string): Promise<void> {
  const meeting = getMeeting(meetingId);
  if (!meeting) return;
  if (meeting.transcription.status === "transcribing") return;

  setTranscriptionStatus(meetingId, "transcribing");
  let chunkDir: string | null = null;
  try {
    config();
    const sourcePath = audioPathFor(meeting.audio.storedName);
    let files: string[];
    let mimeType: string;
    if (await isFfmpegAvailable()) {
      const chunks = await splitIntoChunks(sourcePath, meetingId);
      chunkDir = chunks.dir;
      files = chunks.files;
      mimeType = "audio/mpeg";
    } else {
      if (meeting.audio.size > singleRequestLimitBytes) {
        throw new Error("25MB를 넘는 녹음을 전사하려면 ffmpeg가 설치되어 있어야 합니다.");
      }
      files = [sourcePath];
      mimeType = meeting.audio.mimeType;
    }

    let done = 0;
    setTranscriptionProgress(meetingId, { done, total: files.length });
    const texts = await mapWithConcurrency(files, concurrency, async (file) => {
      const text = await transcribeWithRetry(file, mimeType);
      done += 1;
      setTranscriptionProgress(meetingId, { done, total: files.length });
      return text;
    });
    setTranscript(meetingId, texts.filter(Boolean).join("\n\n"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setTranscriptionStatus(meetingId, "failed", message);
  } finally {
    if (chunkDir) await removeChunks(chunkDir).catch(() => undefined);
  }
}
