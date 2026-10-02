import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMeetingMarkdown } from "../src/lib/meeting-markdown.ts";
import { markdownToSlackHtml, markdownToSlackText } from "../src/lib/slack-clipboard.ts";

test("Slack 복사에서 제목, 참석자, 본문의 분해된 한글을 완성형으로 정규화한다", () => {
  const markdown = buildMeetingMarkdown(
    { title: "이노핏 한솔", date: "2026-10-02", participants: ["태영"] },
    "#### 개요\n* 첫 번째 항목\n* 두 번째 항목",
  );
  for (const convert of [markdownToSlackHtml, markdownToSlackText]) {
    const composed = convert(markdown);
    const decomposed = convert(markdown.normalize("NFD"));
    assert.equal(decomposed, composed);
    assert.equal(decomposed, decomposed.normalize("NFC"));
    assert.ok(decomposed.includes("이노핏 한솔"));
    assert.ok(decomposed.includes("태영"));
    assert.ok(decomposed.includes("개요"));
    assert.ok(decomposed.includes("첫 번째 항목"));
  }
});

test("Slack 복사에서 제목과 불릿은 붙이고 섹션 사이에 빈 줄 하나를 둔다", () => {
  const markdown = buildMeetingMarkdown(
    { title: "미팅", date: "2026-10-02", participants: [] },
    "#### 개요\n* 어쩌구\n* 저쩌구\n\n#### 주제 1\n* 어쩌구\n* 저쩌구",
  );
  assert.equal(
    markdownToSlackHtml(markdown),
    "<p><strong>미팅</strong></p>\n" +
      "<ul>\n<li><strong>날짜</strong>: 2026-10-02</li>\n</ul>\n" +
      "<p><br></p>\n<p><strong>개요</strong></p>\n" +
      "<ul>\n<li>어쩌구</li>\n<li>저쩌구</li>\n</ul>\n" +
      "<p><br></p>\n<p><strong>주제 1</strong></p>\n" +
      "<ul>\n<li>어쩌구</li>\n<li>저쩌구</li>\n</ul>",
  );
  assert.equal(
    markdownToSlackText(markdown),
    "*미팅*\n• *날짜*: 2026-10-02\n\n" +
      "*개요*\n• 어쩌구\n• 저쩌구\n\n" +
      "*주제 1*\n• 어쩌구\n• 저쩌구",
  );
});
