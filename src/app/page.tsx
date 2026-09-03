import Link from "next/link";
import { CalendarDays, Users } from "lucide-react";
import { TranscriptionBadge } from "@/components/transcription-badge";
import { UploadDropzone } from "@/components/upload-dropzone";
import { listMeetings } from "@/lib/meetings";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const meetings = listMeetings();

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">새 미팅</h1>
          <p className="mt-1 text-sm text-zinc-500">
            녹음 파일을 업로드하면 미팅이 만들어지고 전사가 시작됩니다.
          </p>
        </div>
        <UploadDropzone />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">미팅 목록</h2>
        {meetings.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
            아직 미팅이 없습니다. 위에서 녹음 파일을 올려 첫 미팅을 만들어 보세요.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
            {meetings.map((meeting) => (
              <li key={meeting.id}>
                <Link
                  href={`/meetings/${meeting.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{meeting.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3.5" aria-hidden />
                        {meeting.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5" aria-hidden />
                        {meeting.participants.length > 0
                          ? meeting.participants.join(", ")
                          : "참여자 미정"}
                      </span>
                    </p>
                  </div>
                  <TranscriptionBadge transcription={meeting.transcription} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
