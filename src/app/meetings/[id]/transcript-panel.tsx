"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, RefreshCw } from "lucide-react";
import type { Meeting, TranscriptionStatus } from "@/lib/types";

const pollIntervalMs = 3000;

function isActive(status: TranscriptionStatus): boolean {
  return status === "pending" || status === "transcribing";
}

export function TranscriptPanel({ meeting }: { meeting: Meeting }) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const status = meeting.transcription.status;
  const snapshot = JSON.stringify(meeting.transcription);

  useEffect(() => {
    if (!isActive(status)) return;
    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/meetings/${meeting.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const latest = (await res.json()) as Meeting;
        if (!cancelled && JSON.stringify(latest.transcription) !== snapshot) {
          router.refresh();
        }
      } catch {
        return;
      }
    }, pollIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [meeting.id, status, snapshot, router]);

  async function retry() {
    setRetrying(true);
    setRetryError(null);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}/transcribe`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `재요청 실패 (${res.status})`);
      }
      router.refresh();
    } catch (error) {
      setRetryError(error instanceof Error ? error.message : "재요청에 실패했습니다.");
    } finally {
      setRetrying(false);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <FileText className="size-5 text-zinc-400" aria-hidden />
          전사본
        </h2>
        {!isActive(status) && (
          <button
            type="button"
            onClick={retry}
            disabled={retrying}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <RefreshCw className={`size-4 ${retrying ? "animate-spin" : ""}`} aria-hidden />
            다시 전사
          </button>
        )}
      </div>

      {retryError && <p className="text-sm text-red-600 dark:text-red-400">{retryError}</p>}

      {status === "done" && meeting.transcript ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm leading-7 whitespace-pre-wrap dark:border-zinc-800 dark:bg-zinc-950">
          {meeting.transcript}
        </div>
      ) : status === "failed" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <p className="font-medium">전사에 실패했습니다.</p>
          {meeting.transcription.error && (
            <p className="mt-2 font-mono text-xs break-all whitespace-pre-wrap">
              {meeting.transcription.error}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-zinc-300 px-5 py-8 text-sm text-zinc-500 dark:border-zinc-700">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {status === "pending"
            ? "전사 작업을 시작하는 중입니다."
            : meeting.transcription.progress
              ? `녹음을 ${meeting.transcription.progress.total}개 조각으로 나눠 전사하고 있습니다. (${meeting.transcription.progress.done}/${meeting.transcription.progress.total} 완료)`
              : "녹음을 전사용으로 변환하고 있습니다. 완료되면 자동으로 표시됩니다."}
        </div>
      )}
    </section>
  );
}
