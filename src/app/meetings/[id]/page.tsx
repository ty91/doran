import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileAudio, FileText, NotebookPen } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { TranscriptionBadge } from "@/components/transcription-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMeeting, getSummaryVersionContent, listSummaryVersions } from "@/lib/meetings";
import { MeetingHeader } from "./meeting-header";
import { MeetingMeta } from "./meeting-meta";
import { NotesPanel } from "./notes-panel";
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

function parseVersion(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !/^\d+$/.test(value)) return null;
  return Number(value);
}

export default async function MeetingPage(props: PageProps<"/meetings/[id]">) {
  const [{ id }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const meeting = getMeeting(id);
  if (!meeting) notFound();

  const versions = listSummaryVersions(id);
  const latestVersion = versions[0]?.version ?? null;
  const requestedVersion = parseVersion(searchParams.v);
  const selectedVersion =
    requestedVersion !== null && versions.some((v) => v.version === requestedVersion)
      ? requestedVersion
      : latestVersion;
  const selectedContent =
    selectedVersion === null ? null : getSummaryVersionContent(id, selectedVersion);

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-8">
        <MeetingHeader meeting={meeting} />

        <Tabs defaultValue="notes" className="gap-4">
          <TabsList variant="line">
            <TabsTrigger value="notes" className="px-3">
              <NotebookPen aria-hidden />
              노트
            </TabsTrigger>
            <TabsTrigger value="transcript" className="px-3">
              <FileText aria-hidden />
              전사본
              <TranscriptionBadge transcription={meeting.transcription} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" keepMounted>
            <NotesPanel
              meeting={meeting}
              versions={versions}
              selectedVersion={selectedVersion}
              content={selectedContent}
            >
              {selectedContent && <Markdown content={selectedContent} />}
            </NotesPanel>
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

      <aside className="lg:sticky lg:top-8 lg:w-64 lg:shrink-0">
        <MeetingMeta meeting={meeting} />
      </aside>
    </div>
  );
}
