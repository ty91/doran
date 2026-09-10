"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  summaryModels,
  summaryReasoningEfforts,
  type SummarySettings,
} from "@/lib/summary-settings";
import { saveSummarySettingsAction } from "./actions";

const modelItems = summaryModels.map((model) => ({ value: model, label: model }));
const reasoningItems = summaryReasoningEfforts.map((effort) => ({
  value: effort,
  label: effort === "xhigh" ? "extra high" : effort,
}));

export function SummarySettingsEditor({ initialSettings }: { initialSettings: SummarySettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function change(next: SummarySettings) {
    const previous = settings;
    setSettings(next);
    setSaved(false);
    setError(null);
    startTransition(async () => {
      try {
        const result = await saveSummarySettingsAction(next);
        if (result.error) {
          setSettings(previous);
          setError(result.error);
          return;
        }
        setSaved(true);
      } catch {
        setSettings(previous);
        setError("설정을 저장하지 못했습니다. 다시 시도해 주세요.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid max-w-xl gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="summary-model" className="text-sm font-medium">
            모델
          </label>
          <Select
            value={settings.model}
            items={modelItems}
            disabled={isPending}
            onValueChange={(model) => {
              if (model !== null) change({ ...settings, model });
            }}
          >
            <SelectTrigger id="summary-model" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              {modelItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="summary-reasoning" className="text-sm font-medium">
            추론 수준
          </label>
          <Select
            value={settings.reasoningEffort}
            items={reasoningItems}
            disabled={isPending}
            onValueChange={(reasoningEffort) => {
              if (reasoningEffort !== null) change({ ...settings, reasoningEffort });
            }}
          >
            <SelectTrigger id="summary-reasoning" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              {reasoningItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <output
        className={`flex min-h-5 items-center gap-1 text-xs ${error ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}
      >
        {isPending ? (
          <>
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            저장 중
          </>
        ) : error ? (
          error
        ) : saved ? (
          <>
            <Check className="size-3.5" aria-hidden />
            저장됨
          </>
        ) : null}
      </output>
    </div>
  );
}
