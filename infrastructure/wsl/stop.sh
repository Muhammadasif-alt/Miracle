#!/usr/bin/env bash
# Stop PostgreSQL + Redis inside WSL.
#   wsl -d Ubuntu -u root -- bash infrastructure/wsl/stop.sh
set -euo pipefail
systemctl stop redis-server postgresql
echo "postgres + redis stopped"
