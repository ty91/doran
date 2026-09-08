import { after, NextResponse } from "next/server";
import { getMeeting } from "@/lib/meetings";
import { runSummary } from "@/lib/summary";

export async function POST(request: Request, ctx: RouteContext<"/api/meetings/[id]/summarize">) {
  const { id } = await ctx.params;
  let userPrompt: string | undefined;
  try {
    const text = await request.text();
    const body: unknown = text.trim() ? JSON.parse(text) : {};
    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body) ||
      ("userPrompt" in body && typeof body.userPrompt !== "string")
    ) {
      return NextResponse.json(
        { error: "요약 요청사항은 문자열로 입력해 주세요." },
        { status: 400 },
      );
    }
    if ("userPrompt" in body && typeof body.userPrompt === "string") {
      userPrompt = body.userPrompt.trim() || undefined;
    }
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바른 JSON이 아닙니다." }, { status: 400 });
  }
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
  after(() => runSummary(id, userPrompt));
  return NextResponse.json({ ok: true }, { status: 202 });
}
