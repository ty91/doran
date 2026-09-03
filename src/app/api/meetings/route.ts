import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { after, NextResponse } from "next/server";
import {
  audioPathFor,
  extensionOf,
  isSupportedAudio,
  mimeTypeOf,
  supportedExtensions,
  titleFromFileName,
} from "@/lib/audio";
import { createMeeting } from "@/lib/meetings";
import { runTranscription } from "@/lib/transcription";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "녹음 파일이 필요합니다." }, { status: 400 });
  }
  if (!isSupportedAudio(file.name)) {
    return NextResponse.json(
      { error: `지원하지 않는 형식입니다. 가능한 확장자: ${supportedExtensions.join(", ")}` },
      { status: 400 },
    );
  }

  const requestedDate = form.get("date");
  const date =
    typeof requestedDate === "string" && datePattern.test(requestedDate)
      ? requestedDate
      : todayIsoDate();

  const id = randomUUID();
  const storedName = `${id}.${extensionOf(file.name)}`;
  await writeFile(audioPathFor(storedName), Buffer.from(await file.arrayBuffer()));

  const meeting = createMeeting({
    id,
    title: titleFromFileName(file.name),
    date,
    audio: {
      fileName: file.name,
      storedName,
      mimeType: mimeTypeOf(file.name, file.type),
      size: file.size,
    },
  });

  after(() => runTranscription(id));

  return NextResponse.json({ id: meeting.id }, { status: 201 });
}
