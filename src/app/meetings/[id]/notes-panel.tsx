"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { History, Loader2, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Meeting, SummaryVersion } from "@/lib/types";

const pollIntervalMs = 3000;

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function versionLabel(version: number, latestVersion: number | null): string {
  return version === latestVersion ? `v${version} (최신)` : `v${version}`;
}

export function NotesPanel({
  meeting,
  versions,
  selectedVersion,
  children,
}: {
  meeting: Meeting;
  versions: SummaryVersion[];
  selectedVersion: number | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const status = meeting.summarization.status;
  const snapshot = JSON.stringify(meeting.summarization);
  const canGenerate = meeting.transcription.status === "done" && Boolean(meeting.transcript);
  const latestVersion = versions[0]?.version ?? null;
  const selected = versions.find((v) => v.version === selectedVersion) ?? null;

  useEffect(() => {
    if (status !== "generating") return;
    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/meetings/${meeting.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const latest = (await res.json()) as Meeting;
        if (!cancelled && JSON.stringify(latest.summarization) !== snapshot) {
          router.replace(`/meetings/${meeting.id}`, { scroll: false });
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

  async function generate() {
    setRequesting(true);
    setRequestError(null);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}/summarize`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `요청 실패 (${res.status})`);
      }
      router.refresh();
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "요청에 실패했습니다.");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {versions.length > 0 && selectedVersion !== null && (
            <Select
              value={String(selectedVersion)}
              onValueChange={(value) => {
                if (value === null) return;
                const version = Number(value);
                router.push(
                  version === latestVersion
                    ? `/meetings/${meeting.id}`
                    : `/meetings/${meeting.id}?v=${version}`,
                  { scroll: false },
                );
              }}
              items={versions.map((v) => ({
                value: String(v.version),
                label: versionLabel(v.version, latestVersion),
              }))}
            >
              <SelectTrigger size="sm" aria-label="노트 버전">
                <History className="size-4 text-zinc-400" aria-hidden />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={false} className="w-auto min-w-52">
                {versions.map((v) => (
                  <SelectItem key={v.version} value={String(v.version)}>
                    <span className="w-16">{versionLabel(v.version, latestVersion)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatCreatedAt(v.createdAt)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {status !== "generating" && canGenerate && (
          <button
            type="button"
            onClick={generate}
            disabled={requesting}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <Sparkles className="size-4" aria-hidden />
            {versions.length > 0 ? "노트 다시 생성" : "노트 생성"}
          </button>
        )}
      </div>

      {requestError && <p className="text-sm text-red-600 dark:text-red-400">{requestError}</p>}

      {status === "generating" ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-zinc-300 px-5 py-8 text-sm text-zinc-500 dark:border-zinc-700">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {versions.length > 0
            ? `전사본을 읽고 v${versions.length + 1} 노트를 만들고 있습니다. 완료되면 자동으로 표시됩니다.`
            : "전사본을 읽고 요약 노트를 만들고 있습니다. 완료되면 자동으로 표시됩니다."}
        </div>
      ) : (
        <>
          {status === "failed" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              <p className="font-medium">노트 생성에 실패했습니다.</p>
              {meeting.summarization.error && (
                <p className="mt-2 font-mono text-xs break-all whitespace-pre-wrap">
                  {meeting.summarization.error}
                </p>
              )}
            </div>
          )}
          {selected
            ? children
            : status !== "failed" && (
                <p className="rounded-xl border border-dashed border-zinc-300 px-5 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
                  {canGenerate
                    ? "아직 노트가 없습니다. 노트 생성을 눌러 전사본을 요약하세요."
                    : "전사가 완료되면 노트를 생성할 수 있습니다."}
                </p>
              )}
        </>
      )}
    </section>
  );
}
