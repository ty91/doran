"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileAudio, Loader2, Upload } from "lucide-react";

type UploadState =
  | { phase: "idle" }
  | { phase: "uploading"; fileName: string; progress: number }
  | { phase: "error"; message: string };

function localIsoDate(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function uploadFile(file: File, onProgress: (ratio: number) => void): Promise<{ id: string }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("date", localIsoDate(file.lastModified || Date.now()));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/meetings");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(body);
        } else {
          reject(new Error(body.error ?? `업로드 실패 (${xhr.status})`));
        }
      } catch {
        reject(new Error(`업로드 실패 (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("네트워크 오류로 업로드에 실패했습니다."));
    xhr.send(form);
  });
}

export function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ phase: "idle" });
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setState({ phase: "uploading", fileName: file.name, progress: 0 });
    try {
      const { id } = await uploadFile(file, (ratio) =>
        setState({ phase: "uploading", fileName: file.name, progress: ratio }),
      );
      router.push(`/meetings/${id}`);
    } catch (error) {
      setState({
        phase: "error",
        message: error instanceof Error ? error.message : "업로드에 실패했습니다.",
      });
    }
  }

  const uploading = state.phase === "uploading";

  return (
    <div>
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        className={`flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragging
            ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-900"
            : "border-zinc-300 bg-white hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-500 dark:hover:bg-zinc-900"
        } disabled:cursor-wait`}
      >
        {uploading ? (
          <>
            <Loader2 className="size-8 animate-spin text-zinc-500" aria-hidden />
            <div className="text-sm text-zinc-700 dark:text-zinc-300">
              <span className="flex items-center justify-center gap-1.5 font-medium">
                <FileAudio className="size-4" aria-hidden />
                {state.fileName}
              </span>
              <span className="mt-1 block text-zinc-500">
                업로드 중 {Math.round(state.progress * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full bg-zinc-900 transition-[width] dark:bg-zinc-100"
                style={{ width: `${Math.round(state.progress * 100)}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <Upload className="size-8 text-zinc-400" aria-hidden />
            <div className="text-sm text-zinc-700 dark:text-zinc-300">
              <span className="font-medium">녹음 파일을 여기에 놓거나 클릭해서 선택</span>
              <span className="mt-1 block text-zinc-500">
                mp3, m4a, wav, ogg, webm, flac 등을 지원합니다
              </span>
            </div>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.m4a,.mp3,.wav,.ogg,.webm,.flac,.aac,.opus"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {state.phase === "error" && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{state.message}</p>
      )}
    </div>
  );
}
