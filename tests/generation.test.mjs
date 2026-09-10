import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("./") && context.parentURL?.endsWith(".ts")) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

const originalCwd = process.cwd();
const workspace = await mkdtemp(path.join(tmpdir(), "doran-generation-"));
process.chdir(workspace);
const { getDb } = await import("../src/lib/db.ts");
const { addSummaryVersion, createMeeting, getMeeting, listSummaryVersions, setTranscript } =
  await import("../src/lib/meetings.ts");
const { setGlossary } = await import("../src/lib/settings.ts");
const { runTranscription } = await import("../src/lib/transcription.ts");
const { runSummary } = await import("../src/lib/summary.ts");
const envNames = [
  "OPENAI_API_KEY",
  "OPENAI_TRANSCRIBE_MODEL",
  "OPENAI_TRANSCRIBE_LANGUAGE",
  "OPENAI_SUMMARY_MODEL",
];
const originalEnv = Object.fromEntries(envNames.map((name) => [name, process.env[name]]));
for (const name of envNames) delete process.env[name];
process.env.OPENAI_API_KEY = "test-openai-key";
process.env.OPENAI_TRANSCRIBE_LANGUAGE = "ko";
getDb();
const audioPath = path.join(workspace, "data/audio/fixture.mp3");
execFileSync("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-f",
  "lavfi",
  "-i",
  "anullsrc=r=16000:cl=mono",
  "-t",
  "601",
  "-b:a",
  "48k",
  audioPath,
]);
const audio = {
  fileName: "fixture.mp3",
  storedName: "fixture.mp3",
  mimeType: "audio/mpeg",
  size: (await stat(audioPath)).size,
};

function seed(id) {
  createMeeting({ id, title: "Doran 미팅", date: "2026-09-10", audio });
}

after(async () => {
  getDb().close();
  process.chdir(originalCwd);
  for (const [name, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  await rm(workspace, { recursive: true, force: true });
});

test("전사 조각과 재시도에 같은 용어를 보내고 노트와 모델 버전을 저장한다", async (t) => {
  seed("success");
  setGlossary(["Doran", "<태영>\n", "\r\n", "Doran"]);
  let retry = true;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Authorization, "Bearer test-openai-key");
    if (url === "https://api.openai.com/v1/audio/transcriptions") {
      const form = options.body;
      assert.equal(form.get("model"), "gpt-transcribe");
      assert.deepEqual(form.getAll("keywords[]"), ["Doran", "태영"]);
      assert.deepEqual(form.getAll("languages[]"), ["ko"]);
      assert.equal(form.has("language"), false);
      assert.equal(form.get("file").type, "audio/mpeg");
      assert.ok(form.get("file").size > 0);
      setGlossary(["새 용어"]);
      if (form.get("file").name === "0000.mp3" && retry) {
        retry = false;
        return new Response("busy", { status: 429 });
      }
      return Response.json({
        text: form.get("file").name === "0000.mp3" ? " Doran 첫 조각 " : "태영 둘째 조각",
      });
    }
    assert.equal(url, "https://api.openai.com/v1/chat/completions");
    const body = JSON.parse(options.body);
    assert.equal(body.model, "gpt-5.6-luna");
    assert.equal("temperature" in body, false);
    assert.equal(body.messages[0].role, "system");
    assert.match(body.messages[1].content, /Doran 첫 조각\n\n태영 둘째 조각/);
    assert.match(body.messages[1].content, /새 용어/);
    assert.match(body.messages[1].content, /결정 사항 중심/);
    return Response.json({
      choices: [{ message: { content: "```markdown\n#### 개요\n* 결정 사항\n```" } }],
    });
  });
  await runTranscription("success");
  const meeting = getMeeting("success");
  assert.equal(meeting.transcription.status, "done", meeting.transcription.error);
  assert.equal(meeting.transcript, "Doran 첫 조각\n\n태영 둘째 조각");
  assert.deepEqual(meeting.transcription.progress, { done: 2, total: 2 });
  await assert.rejects(stat(path.join(workspace, "data/tmp/success")), { code: "ENOENT" });
  await runSummary("success", "결정 사항 중심");
  assert.equal(getMeeting("success").summarization.status, "done");
  assert.equal(getMeeting("success").summary, "#### 개요\n* 결정 사항");
  assert.equal(listSummaryVersions("success")[0].model, "gpt-5.6-luna");
});

test("빈 사전과 모델 재설정을 지원하고 API 오류에도 기존 노트를 보존한다", async (t) => {
  seed("empty");
  setGlossary([]);
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/audio/transcriptions");
    assert.deepEqual(options.body.getAll("keywords[]"), []);
    assert.equal(options.body.has("prompt"), false);
    return Response.json({ text: "전사본" });
  });
  await runTranscription("empty");
  assert.equal(getMeeting("empty").transcription.status, "done");
  process.env.OPENAI_TRANSCRIBE_MODEL = "gpt-4o-transcribe";
  setGlossary(["Doran"]);
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.equal(options.body.get("model"), "gpt-4o-transcribe");
    assert.equal(options.body.get("prompt"), "Doran");
    assert.equal(options.body.get("language"), "ko");
    assert.equal(options.body.has("languages[]"), false);
    return Response.json({ text: "수정 전사본" });
  });
  await runTranscription("empty");
  assert.equal(getMeeting("empty").transcript, "수정 전사본\n\n수정 전사본");
  delete process.env.OPENAI_TRANSCRIBE_MODEL;
  addSummaryVersion("empty", "기존 노트", "gpt-5.6-luna");
  process.env.OPENAI_SUMMARY_MODEL = "gpt-5.6-terra";
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/chat/completions");
    assert.equal(JSON.parse(options.body).model, "gpt-5.6-terra");
    return new Response("rate limited", { status: 429 });
  });
  await runSummary("empty");
  assert.equal(getMeeting("empty").summarization.status, "failed");
  assert.match(getMeeting("empty").summarization.error, /OpenAI 응답 오류 \(429\)/);
  assert.equal(getMeeting("empty").summary, "기존 노트");
  assert.equal(listSummaryVersions("empty").length, 1);
  delete process.env.OPENAI_SUMMARY_MODEL;
});

test("OpenAI 키가 없으면 전사와 노트 생성 실패를 기록한다", async () => {
  delete process.env.OPENAI_API_KEY;
  seed("missing-key");
  await runTranscription("missing-key");
  assert.equal(getMeeting("missing-key").transcription.status, "failed");
  assert.match(getMeeting("missing-key").transcription.error, /OPENAI_API_KEY/);
  setTranscript("missing-key", "전사본");
  await runSummary("missing-key");
  assert.equal(getMeeting("missing-key").summarization.status, "failed");
  assert.match(getMeeting("missing-key").summarization.error, /OPENAI_API_KEY/);
});
