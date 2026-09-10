import { addSummaryVersion, getMeeting, setSummaryStatus } from "./meetings";
import { getGlossary } from "./settings";
import { buildSummaryUserMessage, summarySystemPrompt } from "./summary-prompt";

const endpoint = "https://api.openai.com/v1/chat/completions";
const defaultModel = "gpt-5.6-luna";

function config() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.");
  }
  return { apiKey, model: process.env.OPENAI_SUMMARY_MODEL || defaultModel };
}

function stripCodeFence(text: string): string {
  const match = text.match(/^```[a-zA-Z]*\s*\n([\s\S]*?)\n```\s*$/);
  return match ? match[1].trim() : text.trim();
}

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: unknown } }>;
  error?: { message?: string };
};

async function requestSummary(userMessage: string): Promise<{ content: string; model: string }> {
  const { apiKey, model } = config();
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: summarySystemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`OpenAI 요청 중 연결 오류: ${message}`, { cause: error });
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI 응답 오류 (${response.status}): ${body.slice(0, 500)}`);
  }
  const json = (await response.json()) as ChatCompletionResponse;
  if (json.error?.message) {
    throw new Error(`OpenAI 응답 오류: ${json.error.message}`);
  }
  const content = json.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenAI 응답에 요약 노트가 없습니다.");
  }
  return { content: stripCodeFence(content), model };
}

export async function runSummary(meetingId: string, userPrompt?: string): Promise<void> {
  const meeting = getMeeting(meetingId);
  if (!meeting) return;
  if (meeting.summarization.status === "generating") return;
  if (meeting.transcription.status !== "done" || !meeting.transcript) {
    setSummaryStatus(meetingId, "failed", "전사가 완료된 뒤에 노트를 생성할 수 있습니다.");
    return;
  }

  setSummaryStatus(meetingId, "generating");
  try {
    const userMessage = buildSummaryUserMessage({
      title: meeting.title,
      date: meeting.date,
      participants: meeting.participants,
      glossary: getGlossary(),
      transcript: meeting.transcript,
      userPrompt,
    });
    const result = await requestSummary(userMessage);
    addSummaryVersion(meetingId, result.content, result.model);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setSummaryStatus(meetingId, "failed", message);
  }
}
