"use client";

import { useState, useTransition } from "react";
import { CalendarDays, Users } from "lucide-react";
import { TagInput } from "@/components/tag-input";
import type { Meeting } from "@/lib/types";
import { updateDateAction, updateParticipantsAction } from "./actions";

export function MeetingMeta({ meeting }: { meeting: Meeting }) {
  const [date, setDate] = useState(meeting.date);
  const [participants, setParticipants] = useState(meeting.participants);
  const [, startTransition] = useTransition();

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
    <dl className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
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
            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm outline-none focus:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-950"
          />
        </dd>
      </div>
      <div className="flex flex-col gap-2">
        <dt className="flex items-center gap-1.5 text-sm text-zinc-500">
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
      </div>
    </dl>
  );
}
