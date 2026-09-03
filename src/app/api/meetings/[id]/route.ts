import { NextResponse } from "next/server";
import { getMeeting } from "@/lib/meetings";

export async function GET(_request: Request, ctx: RouteContext<"/api/meetings/[id]">) {
  const { id } = await ctx.params;
  const meeting = getMeeting(id);
  if (!meeting) {
    return NextResponse.json({ error: "미팅을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json(meeting);
}
