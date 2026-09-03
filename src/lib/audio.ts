import path from "node:path";
import { audioDir } from "./paths";

const formatByExtension: Record<string, string> = {
  mp3: "mp3",
  wav: "wav",
  m4a: "m4a",
  mp4: "mp4",
  aac: "aac",
  ogg: "ogg",
  oga: "ogg",
  opus: "ogg",
  webm: "webm",
  flac: "flac",
  mpeg: "mpeg",
  mpga: "mp3",
};

const mimeByExtension: Record<string, string> = {
  mp3: "audio/mpeg",
  mpga: "audio/mpeg",
  mpeg: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  opus: "audio/ogg",
  webm: "audio/webm",
  flac: "audio/flac",
};

export const supportedExtensions = Object.keys(formatByExtension);

export function extensionOf(fileName: string): string {
  return path.extname(fileName).slice(1).toLowerCase();
}

export function isSupportedAudio(fileName: string): boolean {
  return extensionOf(fileName) in formatByExtension;
}

export function transcriptionFormatOf(fileName: string): string {
  const ext = extensionOf(fileName);
  return formatByExtension[ext] ?? ext;
}

export function mimeTypeOf(fileName: string, fallback: string): string {
  const ext = extensionOf(fileName);
  return mimeByExtension[ext] ?? (fallback || "application/octet-stream");
}

export function titleFromFileName(fileName: string): string {
  const base = path.basename(fileName, path.extname(fileName)).trim();
  return base || "제목 없는 미팅";
}

export function audioPathFor(storedName: string): string {
  return path.join(audioDir, path.basename(storedName));
}
