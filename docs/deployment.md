# 배포

홈랩 맥미니(`ssh mini`)에서 launchd 사용자 에이전트로 실행하고, Tailscale Serve로 tailnet 안에서만 노출합니다. 인증이 없는 앱이므로 공개 인터넷에는 절대 열지 않습니다.

## 구성

- 접속 주소: `https://mini.tail5f617e.ts.net/` (tailnet 전용, 인증서는 Tailscale이 발급)
- 앱은 `127.0.0.1:13000`에만 바인딩합니다. LAN에서도 직접 접근할 수 없고 Tailscale Serve만 앞단에 섭니다. 이 설정은 `tailscale serve --bg 13000`으로 등록했으며 재부팅 후에도 유지됩니다. 앱 포트를 바꾸면 Serve의 연결 대상도 함께 갱신해야 합니다. HTTPS 접속 주소는 그대로 유지됩니다.
- 코드는 `~/Developer/workspace/doran`에 GitHub `main`을 클론해 둔 것입니다. 배포는 `git pull` → `pnpm build` → 서비스 재시작입니다.
- 서비스 정의는 `deploy/com.ty91.doran.plist`이며 `~/Library/LaunchAgents/`에 복사됩니다. Node와 pnpm은 맥미니의 mise가 제공하므로 `mise exec`로 실행합니다. 로그는 `~/.doran/logs/`에 쌓입니다.
- `ffmpeg`는 Homebrew로 설치되어 있습니다. 없으면 25MB 초과 녹음의 전사가 실패합니다.
- `.env`는 git에 없으므로 맥미니에 직접 둡니다. 키를 바꾸면 `scp .env mini:Developer/workspace/doran/.env` 후 서비스를 재시작합니다.

## 재배포

로컬에서 `main`을 푸시한 뒤 실행합니다.

```sh
deploy/deploy.sh
```

빌드 중에도 기존 프로세스가 계속 서비스하다가 마지막에 재시작됩니다. 재시작 시점에 진행 중이던 전사나 노트 생성은 `failed`로 바뀌므로, 긴 전사가 도는 동안에는 배포를 미룹니다.

## 데이터

`data/`(SQLite + 녹음 원본)는 최초 배포 때 로컬에서 한 번 복사했고, 그 뒤로는 맥미니가 원본입니다. 로컬과 자동 동기화하지 않습니다. 다시 복사해야 한다면 앱을 멈춘 상태에서 `sqlite3 data/doran.db ".backup out.db"`로 WAL까지 반영된 복사본을 만들어 옮깁니다. `-wal`, `-shm` 파일을 그대로 rsync하지 않습니다.
