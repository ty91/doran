import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileAudio, FileText, NotebookPen } from "lucide-react";
import { TranscriptionBadge } from "@/components/transcription-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMeeting } from "@/lib/meetings";
import { MeetingHeader } from "./meeting-header";
import { TranscriptPanel } from "./transcript-panel";

export const dynamic = "force-dynamic";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function generateMetadata(props: PageProps<"/meetings/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const meeting = getMeeting(id);
  return { title: meeting?.title ?? "미팅" };
}

export default async function MeetingPage(props: PageProps<"/meetings/[id]">) {
  const { id } = await props.params;
  const meeting = getMeeting(id);
  if (!meeting) notFound();

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/"
        className="flex w-fit items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        <ArrowLeft className="size-4" aria-hidden />
        미팅 목록
      </Link>

      <MeetingHeader meeting={meeting} />

      <Tabs defaultValue="notes" className="gap-4">
        <TabsList>
          <TabsTrigger value="notes" className="px-3">
            <NotebookPen aria-hidden />
            미팅 노트
          </TabsTrigger>
          <TabsTrigger value="transcript" className="px-3">
            <FileText aria-hidden />
            전사본
            <TranscriptionBadge transcription={meeting.transcription} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes">
          {meeting.summary ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm leading-7 whitespace-pre-wrap dark:border-zinc-800 dark:bg-zinc-950">
              {meeting.summary}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-zinc-300 px-5 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
              요약 노트 생성은 아직 준비 중입니다.
            </p>
          )}
        </TabsContent>

        <TabsContent value="transcript" keepMounted className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <FileAudio className="size-5 text-zinc-400" aria-hidden />
              녹음
            </h2>
            <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
                {meeting.audio.fileName}
                <span className="ml-2 text-zinc-400">{formatSize(meeting.audio.size)}</span>
              </p>
              <audio
                controls
                preload="metadata"
                src={`/api/meetings/${meeting.id}/audio`}
                className="w-full"
              />
            </div>
          </section>

          <TranscriptPanel meeting={meeting} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
