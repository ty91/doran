import type { Metadata } from "next";
import { BookA, Sparkles } from "lucide-react";
import { getGlossary, getSummarySettings } from "@/lib/settings";
import { GlossaryEditor } from "./glossary-editor";
import { SummarySettingsEditor } from "./summary-settings-editor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "설정" };

export default function SettingsPage() {
  const glossary = getGlossary();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">설정</h1>
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Sparkles className="size-5 text-zinc-400" aria-hidden />
            노트 생성
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            모델과 추론 수준을 선택하면 자동으로 저장되며, 다음 노트 생성부터 적용됩니다.
          </p>
        </div>
        <SummarySettingsEditor initialSettings={getSummarySettings()} />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <BookA className="size-5 text-zinc-400" aria-hidden />
            용어 사전
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            전사와 요약 노트를 만들 때 함께 전달할 용어입니다. 사내 용어, 제품명, 사람 이름 등을
            등록해 두면 음성 인식과 요약 품질을 높이는 데 도움이 됩니다.
          </p>
        </div>
        <GlossaryEditor initialTerms={glossary} />
      </section>
    </div>
  );
}
