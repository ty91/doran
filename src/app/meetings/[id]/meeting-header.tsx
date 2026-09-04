"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
  const [editingTitle, setEditingTitle] = useState(false);
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

  return (
    <header className="flex items-center gap-2">
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
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-2xl font-semibold tracking-tight outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditingTitle(true)}
          className="group flex min-w-0 flex-1 items-center gap-2 text-left text-2xl font-semibold tracking-tight"
        >
          <span className="truncate">{title}</span>
          <Pencil
            className="size-4 shrink-0 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </button>
      )}
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
