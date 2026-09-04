"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Meeting } from "@/lib/types";
import { deleteMeetingAction, updateTitleAction } from "./actions";

export function MeetingHeader({ meeting }: { meeting: Meeting }) {
  const [title, setTitle] = useState(meeting.title);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function commitTitle(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      setTitle(meeting.title);
      return;
    }
    setTitle(trimmed);
    if (trimmed !== meeting.title) {
      startTransition(() => updateTitleAction(meeting.id, trimmed));
    }
  }

  return (
    <header className="flex items-center gap-2">
      <input
        value={title}
        aria-label="미팅 제목"
        placeholder="제목 없음"
        onChange={(e) => setTitle(e.target.value)}
        onBlur={(e) => commitTitle(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            e.currentTarget.value = meeting.title;
            e.currentTarget.blur();
          }
        }}
        className="min-w-0 max-w-full field-sizing-content truncate bg-transparent p-0 text-2xl font-semibold tracking-tight outline-none"
      />
      {confirmingDelete ? (
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => startTransition(() => deleteMeetingAction(meeting.id))}
            disabled={isPending}
          >
            정말 삭제
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
            취소
          </Button>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="미팅 메뉴"
                className="shrink-0 text-zinc-500"
              />
            }
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-auto min-w-36">
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmingDelete(true)}>
              <Trash2 aria-hidden />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
