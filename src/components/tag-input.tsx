"use client";

import { useState } from "react";
import { X } from "lucide-react";

type TagInputProps = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  label: string;
};

export function TagInput({ value, onChange, placeholder, label }: TagInputProps) {
  const [draft, setDraft] = useState("");

  function commit() {
    const term = draft.trim();
    if (!term) return;
    if (!value.includes(term)) {
      onChange([...value, term]);
    }
    setDraft("");
  }

  function remove(term: string) {
    onChange(value.filter((t) => t !== term));
  }

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 focus-within:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-within:border-zinc-600">
      {value.map((term) => (
        <span
          key={term}
          className="flex items-center gap-1 rounded-full bg-zinc-100 py-1 pr-1 pl-3 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {term}
          <button
            type="button"
            onClick={() => remove(term)}
            aria-label={`${term} 삭제`}
            className="rounded-full p-0.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-zinc-50"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        aria-label={label}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={commit}
        className="min-w-32 flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-zinc-400"
      />
    </div>
  );
}
