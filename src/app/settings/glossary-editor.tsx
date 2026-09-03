"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { TagInput } from "@/components/tag-input";
import { saveGlossaryAction } from "./actions";

export function GlossaryEditor({ initialTerms }: { initialTerms: string[] }) {
  const [terms, setTerms] = useState(initialTerms);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function change(next: string[]) {
    setTerms(next);
    setSaved(false);
    startTransition(async () => {
      await saveGlossaryAction(next);
      setSaved(true);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <TagInput label="용어" value={terms} onChange={change} placeholder="용어 입력 후 Enter" />
      <p className="flex h-5 items-center gap-1 text-xs text-zinc-500">
        {isPending ? (
          <>
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            저장 중
          </>
        ) : saved ? (
          <>
            <Check className="size-3.5" aria-hidden />
            저장됨
          </>
        ) : null}
      </p>
    </div>
  );
}
