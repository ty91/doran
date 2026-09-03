# 데이터 모델

## 저장 위치

```
data/
├── doran.db          # SQLite (WAL 모드)
├── audio/<id>.<ext>  # 업로드 원본. 파일명은 미팅 id + 원본 확장자
└── tmp/<id>/         # 전사 중 ffmpeg 조각. 완료/실패 후 삭제
```

`data/`는 프로젝트 루트 기준 고정 경로이며 git에서 제외됩니다. 환경 변수로 바꾸지 않는 이유는 Turbopack이 동적 경로 접근을 만나면 프로젝트 전체를 출력에 포함시키기 때문입니다.

## 왜 `node:sqlite`인가

Node 24에 내장되어 네이티브 빌드가 필요 없고, pnpm의 빌드 스크립트 차단 설정과 충돌하지 않습니다. 사용자 한 명, 프로세스 하나인 앱이라 ORM이나 외부 DB 서버가 주는 이점이 없습니다. 쿼리는 `src/lib/meetings.ts`와 `settings.ts`에만 두고 다른 곳에서 SQL을 쓰지 않습니다.

## 테이블

### meetings

| 컬럼                       | 타입    | 설명                                                    |
| -------------------------- | ------- | ------------------------------------------------------- |
| `id`                       | TEXT PK | UUID                                                    |
| `title`                    | TEXT    | 초기값은 파일명(확장자 제외)                            |
| `meeting_date`             | TEXT    | `YYYY-MM-DD`                                            |
| `participants`             | TEXT    | JSON 문자열 배열                                        |
| `audio_file_name`          | TEXT    | 업로드 당시 원본 파일명                                 |
| `audio_stored_name`        | TEXT    | `data/audio/` 안의 실제 파일명                          |
| `audio_mime_type`          | TEXT    | 스트리밍 응답의 Content-Type                            |
| `audio_size`               | INTEGER | 바이트                                                  |
| `transcript`               | TEXT    | 전사본. 완료 전에는 NULL                                |
| `transcription_status`     | TEXT    | `pending` / `transcribing` / `done` / `failed`          |
| `transcription_error`      | TEXT    | 실패 메시지                                             |
| `transcription_progress`   | TEXT    | JSON `{ "done": n, "total": m }`. 전사 중에만 의미 있음 |
| `summary`                  | TEXT    | 요약 노트. 아직 쓰지 않음                               |
| `created_at`, `updated_at` | TEXT    | ISO 8601                                                |

인덱스: `(meeting_date DESC, created_at DESC)`. 목록 정렬 순서와 같습니다.

### settings

키-값 테이블입니다. 현재 키는 `glossary` 하나이며 값은 JSON 문자열 배열입니다.

## 마이그레이션

전용 마이그레이션 도구 없이 `src/lib/db.ts`에서 처리합니다.

1. `CREATE TABLE IF NOT EXISTS`로 최신 스키마를 만듭니다. 새 DB는 이것으로 끝납니다.
2. 기존 DB에 컬럼을 추가할 때는 `PRAGMA table_info`로 존재 여부를 확인한 뒤 `ALTER TABLE ... ADD COLUMN`을 실행합니다. 이 코드를 `migrate()`에 누적합니다.
3. `schemaVersion` 상수를 올립니다. 연결 싱글턴이 `globalThis`에 버전별 키로 저장되므로, dev 서버가 HMR로 모듈을 다시 읽어도 새 연결을 열어 마이그레이션이 실행됩니다.

컬럼 삭제나 타입 변경이 필요해지면 그때 방식을 다시 정합니다. 지금은 추가만 지원합니다.
