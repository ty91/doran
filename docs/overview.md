# 개요

Doran은 미팅 녹음 파일을 올리면 전사본과 요약 노트를 만들어 주는 개인용 웹 앱입니다.

## 범위와 전제

- 로컬 또는 Tailscale 네트워크 안에서 한 사람이 사용합니다. 인증과 로그인은 없고, 모든 API는 무방비입니다. 공개 인터넷에 노출하지 않는 것이 전제입니다.
- 사용자 한 명, 서버 프로세스 하나를 가정합니다. 동시성 제어는 이 전제 안에서만 고려합니다.
- 요약 노트는 자동으로 만들지 않습니다. 전사가 끝난 뒤 사용자가 미팅 노트 탭에서 직접 생성을 누릅니다. 전사 결과를 확인하거나 용어 사전과 참석자를 정리한 뒤에 생성하는 편이 결과가 좋기 때문입니다.

## 스택

- Next.js 16 App Router, React 19, TypeScript, Tailwind v4
- UI 컴포넌트: shadcn (Base UI 기반, `nova` 프리셋). 생성된 파일은 `src/components/ui`에 둡니다
- 저장소: Node 24 내장 `node:sqlite` + 로컬 파일 시스템
- 전사: OpenAI `/v1/audio/transcriptions` (기본 모델 `gpt-transcribe`)
- 요약 노트: OpenAI `/v1/chat/completions` (기본 모델 `gpt-5.6-sol`, reasoning effort `high`)
- 마크다운 렌더링: react-markdown (`src/components/markdown.tsx`)
- 아이콘: lucide-react
- 린터/포매터: oxlint, oxfmt
- 패키지 매니저: pnpm

## 외부 도구 의존

- `ffmpeg`, `ffprobe`가 PATH에 있어야 25MB를 넘는 녹음을 전사할 수 있습니다. 없으면 작은 파일만 단일 요청으로 처리하고, 큰 파일은 실패 메시지를 남깁니다.

## 실행

```sh
pnpm dev        # 0.0.0.0:3000 바인딩, Tailscale 접근 가능
pnpm build && pnpm start
pnpm lint       # oxlint
pnpm format     # oxfmt (--check는 format:check)
pnpm typecheck  # tsc --noEmit
```

## 환경 변수

`.env`에 둡니다. 템플릿은 `.env.example`입니다.

| 변수                         | 필수   | 설명                                                                                     |
| ---------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`             | 예     | OpenAI API 키                                                                            |
| `OPENAI_TRANSCRIBE_MODEL`    | 아니오 | 전사 모델 ID. 기본값 `gpt-transcribe`                                                    |
| `OPENAI_TRANSCRIBE_LANGUAGE` | 아니오 | ISO 639-1 언어 코드. 비우면 자동 감지                                                    |
| `OPENAI_SUMMARY_MODEL`       | 아니오 | 요약 노트 모델 ID. 기본값 `gpt-5.6-sol`                                                  |
| `ALLOWED_DEV_ORIGINS`        | 아니오 | dev 서버에 localhost 외 호스트명으로 접속할 때 쉼표로 나열 (예: Tailscale MagicDNS 이름) |

기존 `OPENROUTER_*` 변수는 더 이상 읽지 않습니다. 모델을 별도로 지정하려면 `OPENAI_*` 변수에 `openai/` 접두어 없는 OpenAI 모델 ID를 넣습니다. `.env`를 변경한 뒤에는 서버를 재시작합니다.

## 배포

홈랩 맥미니에 launchd + Tailscale Serve로 배포합니다. 절차는 [deployment.md](deployment.md)를 참고합니다.

## 데이터 위치

`data/` 아래에 SQLite DB와 원본 녹음이 저장되며 git에서 제외됩니다. 자세한 구조는 [data-model.md](data-model.md)를 참고합니다.
