import { after, NextResponse } from "next/server";
import { getMeeting } from "@/lib/meetings";
import { runTranscription } from "@/lib/transcription";

export async function POST(_request: Request, ctx: RouteContext<"/api/meetings/[id]/transcribe">) {
  const { id } = await ctx.params;
  const meeting = getMeeting(id);
  if (!meeting) {
    return NextResponse.json({ error: "미팅을 찾을 수 없습니다." }, { status: 404 });
  }
  if (meeting.transcription.status === "transcribing") {
    return NextResponse.json({ error: "이미 전사가 진행 중입니다." }, { status: 409 });
  }
  after(() => runTranscription(id));
  return NextResponse.json({ ok: true }, { status: 202 });
}
