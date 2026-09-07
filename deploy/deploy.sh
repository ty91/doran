#!/bin/sh
set -eu

HOST="${DORAN_DEPLOY_HOST:-mini}"
APP_DIR="/Users/taeyoung/Developer/workspace/doran"
LABEL="com.ty91.doran"
PLIST="$(cd "$(dirname "$0")" && pwd)/$LABEL.plist"

scp -q "$PLIST" "$HOST:Library/LaunchAgents/$LABEL.plist"

ssh "$HOST" "export PATH=/opt/homebrew/bin:\$PATH
set -eu
cd $APP_DIR
git pull --ff-only
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm build
launchctl bootout gui/\$(id -u)/$LABEL 2>/dev/null || true
for _ in \$(seq 1 20); do
  launchctl print gui/\$(id -u)/$LABEL >/dev/null 2>&1 || break
  sleep 0.5
done
launchctl bootstrap gui/\$(id -u) ~/Library/LaunchAgents/$LABEL.plist
sleep 3
curl -sf -o /dev/null http://127.0.0.1:13000/ && echo 'doran is up'"
