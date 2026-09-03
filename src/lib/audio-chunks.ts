import { spawn } from "node:child_process";
import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { dataDir } from "./paths";

export const chunkSeconds = 600;

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (data) => {
      stderr += String(data);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} 종료 코드 ${code}: ${stderr.trim().slice(-500)}`));
    });
  });
}

export async function isFfmpegAvailable(): Promise<boolean> {
  try {
    await run("ffmpeg", ["-version"]);
    return true;
  } catch {
    return false;
  }
}

export async function splitIntoChunks(
  inputPath: string,
  meetingId: string,
): Promise<{ dir: string; files: string[] }> {
  const dir = path.join(dataDir, "tmp", meetingId);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  await run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    inputPath,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-b:a",
    "48k",
    "-f",
    "segment",
    "-segment_time",
    String(chunkSeconds),
    "-reset_timestamps",
    "1",
    path.join(dir, "%04d.mp3"),
  ]);
  const files = (await readdir(dir))
    .filter((name) => name.endsWith(".mp3"))
    .sort()
    .map((name) => path.join(dir, name));
  if (files.length === 0) {
    throw new Error("ffmpeg가 오디오 조각을 만들지 못했습니다.");
  }
  return { dir, files };
}

export async function removeChunks(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}
