"use client";

import { useState, useTransition } from "react";
import { CalendarDays, Pencil, Trash2, Users } from "lucide-react";
import { TagInput } from "@/components/tag-input";
import type { Meeting } from "@/lib/types";
import {
  deleteMeetingAction,
  updateDateAction,
  updateParticipantsAction,
  updateTitleAction,
} from "./actions";

export function MeetingHeader({ meeting }: { meeting: Meeting }) {
  const [title, setTitle] = useState(meeting.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [date, setDate] = useState(meeting.date);
  const [participants, setParticipants] = useState(meeting.participants);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function commitTitle() {
    setEditingTitle(false);
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(meeting.title);
      return;
    }
    if (trimmed !== meeting.title) {
      startTransition(() => updateTitleAction(meeting.id, trimmed));
    }
  }

  function changeDate(next: string) {
    setDate(next);
    if (next) {
      startTransition(() => updateDateAction(meeting.id, next));
    }
  }

  function changeParticipants(next: string[]) {
    setParticipants(next);
    startTransition(() => updateParticipantsAction(meeting.id, next));
  }

  return (
    <header className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        {editingTitle ? (
          <input
            ref={(element) => element?.focus()}
            value={title}
            aria-label="미팅 제목"
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter") commitTitle();
              if (e.key === "Escape") {
                setTitle(meeting.title);
                setEditingTitle(false);
              }
            }}
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-2xl font-semibold tracking-tight outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            className="group flex min-w-0 items-center gap-2 text-left text-2xl font-semibold tracking-tight"
          >
            <span className="truncate">{title}</span>
            <Pencil
              className="size-4 shrink-0 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden
            />
          </button>
        )}
        <div className="flex shrink-0 items-center gap-2">
          {confirmingDelete ? (
            <>
              <button
                type="button"
                onClick={() => startTransition(() => deleteMeetingAction(meeting.id))}
                disabled={isPending}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                정말 삭제
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                취소
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-zinc-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950 dark:hover:text-red-300"
            >
              <Trash2 className="size-4" aria-hidden />
              삭제
            </button>
          )}
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <dt className="flex items-center gap-1.5 text-sm text-zinc-500">
          <CalendarDays className="size-4" aria-hidden />
          미팅 날짜
        </dt>
        <dd>
          <input
            type="date"
            value={date}
            aria-label="미팅 날짜"
            onChange={(e) => changeDate(e.target.value)}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm outline-none focus:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-950"
          />
        </dd>
        <dt className="flex items-center gap-1.5 self-start pt-2.5 text-sm text-zinc-500">
          <Users className="size-4" aria-hidden />
          참여자
        </dt>
        <dd>
          <TagInput
            label="참여자"
            value={participants}
            onChange={changeParticipants}
            placeholder="이름 입력 후 Enter"
          />
        </dd>
      </dl>
    </header>
  );
}
