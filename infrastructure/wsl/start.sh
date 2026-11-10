#!/usr/bin/env bash
# Start PostgreSQL + Redis inside WSL and wait until both answer. Idempotent.
#   wsl -d Ubuntu -u root -- bash infrastructure/wsl/start.sh
set -euo pipefail
PG_PORT="${POSTGRES_PORT:-5433}"
REDIS_PORT="${REDIS_PORT:-6380}"

systemctl start postgresql redis-server

for _ in $(seq 1 30); do pg_isready -q -p "$PG_PORT" && break; sleep 1; done
pg_isready -p "$PG_PORT"

for _ in $(seq 1 30); do [ "$(redis-cli -p "$REDIS_PORT" ping 2>/dev/null || true)" = "PONG" ] && break; sleep 1; done
echo "redis :$REDIS_PORT — $(redis-cli -p "$REDIS_PORT" ping)"
