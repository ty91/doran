import type { Meeting } from "@/lib/types";

export function buildMeetingMarkdown(
  meeting: Pick<Meeting, "title" | "date" | "participants">,
  content: string,
): string {
  const meta = [`**날짜**: ${meeting.date}`];
  if (meeting.participants.length > 0) {
    meta.push(`**참석자**: ${meeting.participants.join(", ")}`);
  }
  return `# ${meeting.title}\n\n${meta.join("\n")}\n\n${content.trim()}\n`;
}
