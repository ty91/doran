"use server";

import { revalidatePath } from "next/cache";
import { setGlossary, setSummarySettings } from "@/lib/settings";
import { isSummarySettings, type SummarySettings } from "@/lib/summary-settings";

export async function saveSummarySettingsAction(
  settings: SummarySettings,
): Promise<{ error?: string }> {
  if (!isSummarySettings(settings)) {
    return { error: "노트 생성 모델과 추론 수준을 확인해 주세요." };
  }
  try {
    setSummarySettings(settings);
  } catch {
    return { error: "설정을 저장하지 못했습니다. 다시 시도해 주세요." };
  }
  revalidatePath("/settings");
  return {};
}

export async function saveGlossaryAction(terms: string[]): Promise<void> {
  setGlossary(terms);
  revalidatePath("/settings");
}
