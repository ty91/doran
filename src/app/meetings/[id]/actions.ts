"use server";

import { unlink } from "node:fs/promises";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audioPathFor } from "@/lib/audio";
import { deleteMeeting, updateMeeting } from "@/lib/meetings";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export async function updateTitleAction(id: string, title: string): Promise<void> {
  const trimmed = title.trim();
  if (!trimmed) return;
  updateMeeting(id, { title: trimmed });
  revalidatePath("/");
  revalidatePath(`/meetings/${id}`);
}

export async function updateDateAction(id: string, date: string): Promise<void> {
  if (!datePattern.test(date)) return;
  updateMeeting(id, { date });
  revalidatePath("/");
  revalidatePath(`/meetings/${id}`);
}

export async function updateParticipantsAction(id: string, participants: string[]): Promise<void> {
  const cleaned = Array.from(new Set(participants.map((p) => p.trim()).filter(Boolean)));
  updateMeeting(id, { participants: cleaned });
  revalidatePath("/");
  revalidatePath(`/meetings/${id}`);
}

export async function deleteMeetingAction(id: string): Promise<void> {
  const meeting = deleteMeeting(id);
  if (meeting) {
    await unlink(audioPathFor(meeting.audio.storedName)).catch(() => undefined);
  }
  revalidatePath("/");
  redirect("/");
}
