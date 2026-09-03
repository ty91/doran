import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { audioPathFor } from "@/lib/audio";
import { getMeeting } from "@/lib/meetings";

export async function GET(request: Request, ctx: RouteContext<"/api/meetings/[id]/audio">) {
  const { id } = await ctx.params;
  const meeting = getMeeting(id);
  if (!meeting) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = audioPathFor(meeting.audio.storedName);
  let size: number;
  try {
    size = (await stat(filePath)).size;
  } catch {
    return new Response("Audio file missing", { status: 404 });
  }

  const baseHeaders = {
    "Content-Type": meeting.audio.mimeType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=0",
  };

  const range = request.headers.get("range");
  const match = range ? /^bytes=(\d*)-(\d*)$/.exec(range) : null;
  if (!match) {
    return new Response(Readable.toWeb(createReadStream(filePath)) as ReadableStream, {
      status: 200,
      headers: { ...baseHeaders, "Content-Length": String(size) },
    });
  }

  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
    return new Response(null, {
      status: 416,
      headers: { ...baseHeaders, "Content-Range": `bytes */${size}` },
    });
  }

  return new Response(
    Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream,
    {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${size}`,
      },
    },
  );
}
