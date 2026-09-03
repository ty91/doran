import { AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import type { TranscriptionState, TranscriptionStatus } from "@/lib/types";

const labels: Record<TranscriptionStatus, string> = {
  pending: "전사 대기",
  transcribing: "전사 중",
  done: "전사 완료",
  failed: "전사 실패",
};

const styles: Record<TranscriptionStatus, string> = {
  pending: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  transcribing: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  done: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  failed: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function TranscriptionBadge({ transcription }: { transcription: TranscriptionState }) {
  const { status, progress } = transcription;
  const label =
    status === "transcribing" && progress && progress.total > 1
      ? `${labels[status]} ${progress.done}/${progress.total}`
      : labels[status];
  const Icon =
    status === "done"
      ? CheckCircle2
      : status === "failed"
        ? AlertCircle
        : status === "transcribing"
          ? Loader2
          : Clock;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      <Icon className={`size-3.5 ${status === "transcribing" ? "animate-spin" : ""}`} aria-hidden />
      {label}
    </span>
  );
}
