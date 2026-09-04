import { after, NextResponse } from "next/server";
import { getMeeting } from "@/lib/meetings";
import { runSummary } from "@/lib/summary";

export async function POST(_request: Request, ctx: RouteContext<"/api/meetings/[id]/summarize">) {
  const { id } = await ctx.params;
  const meeting = getMeeting(id);
  if (!meeting) {
    return NextResponse.json({ error: "미팅을 찾을 수 없습니다." }, { status: 404 });
  }
  if (meeting.transcription.status !== "done" || !meeting.transcript) {
    return NextResponse.json(
      { error: "전사가 완료된 뒤에 노트를 생성할 수 있습니다." },
      { status: 409 },
    );
  }
  if (meeting.summarization.status === "generating") {
    return NextResponse.json({ error: "이미 노트를 생성하고 있습니다." }, { status: 409 });
  }
  after(() => runSummary(id));
  return NextResponse.json({ ok: true }, { status: 202 });
}
