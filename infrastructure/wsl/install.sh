#!/usr/bin/env bash
# Miracle (Revenue OS) — local dev infrastructure inside WSL Ubuntu, no Docker needed.
# Installs PostgreSQL 18 + pgvector + Redis, puts them on the project's dev ports
# (Postgres 5433, Redis 6380 — same as .env.example) and creates the dev role + database.
#
#   Run once, as root, from the repo root on Windows:
#     wsl -d Ubuntu -u root -- bash infrastructure/wsl/install.sh
#   Safe to run again.
set -euo pipefail

PG_VER="${PG_VER:-18}"
PG_PORT="${POSTGRES_PORT:-5433}"
PG_USER="${POSTGRES_USER:-revenue_os}"
PG_PASS="${POSTGRES_PASSWORD:-revenue_os_dev}"
PG_DB="${POSTGRES_DB:-revenue_os}"
REDIS_PORT="${REDIS_PORT:-6380}"

export DEBIAN_FRONTEND=noninteractive
echo "==> Installing postgresql-$PG_VER, postgresql-$PG_VER-pgvector, redis-server"
apt-get update -qq
apt-get install -y -qq "postgresql-$PG_VER" "postgresql-$PG_VER-pgvector" redis-server

PG_CONF_DIR="/etc/postgresql/$PG_VER/main"
echo "==> Configuring PostgreSQL ($PG_CONF_DIR): port $PG_PORT, listen on all interfaces"
sed -i -E "s/^#?port = [0-9]+/port = $PG_PORT/" "$PG_CONF_DIR/postgresql.conf"
sed -i -E "s/^#?listen_addresses = .*/listen_addresses = '*'/" "$PG_CONF_DIR/postgresql.conf"
# Windows reaches WSL through the NAT gateway, not loopback, so allow password auth from any address.
# The WSL VM is not reachable from the LAN in default NAT mode; the password still protects it.
if ! grep -q "miracle-dev" "$PG_CONF_DIR/pg_hba.conf"; then
  cat >> "$PG_CONF_DIR/pg_hba.conf" <<HBA_EOF

# miracle-dev: connections from the Windows host (WSL NAT)
host    all             all             0.0.0.0/0               scram-sha-256
host    all             all             ::/0                    scram-sha-256
HBA_EOF
fi

echo "==> Configuring Redis: port $REDIS_PORT, reachable from Windows, appendonly on"
REDIS_CONF=/etc/redis/redis.conf
sed -i -E "s/^port [0-9]+/port $REDIS_PORT/" "$REDIS_CONF"
sed -i -E "s/^bind .*/bind 0.0.0.0/" "$REDIS_CONF"
sed -i -E "s/^protected-mode yes/protected-mode no/" "$REDIS_CONF"
sed -i -E "s/^appendonly no/appendonly yes/" "$REDIS_CONF"

echo "==> Enabling + restarting services"
systemctl enable postgresql redis-server >/dev/null 2>&1 || true
systemctl restart postgresql
systemctl restart redis-server

echo "==> Waiting for PostgreSQL on :$PG_PORT"
for _ in $(seq 1 30); do pg_isready -q -p "$PG_PORT" && break; sleep 1; done
pg_isready -p "$PG_PORT"

echo "==> Creating role '$PG_USER' and database '$PG_DB' (idempotent)"
PSQL="psql -p $PG_PORT -v ON_ERROR_STOP=1"
if ! su - postgres -c "$PSQL -tAc \"SELECT 1 FROM pg_roles WHERE rolname='$PG_USER'\"" | grep -q 1; then
  su - postgres -c "$PSQL -c \"CREATE ROLE $PG_USER LOGIN SUPERUSER PASSWORD '$PG_PASS'\""
fi
# Always (re)set the password so a re-run matches .env
su - postgres -c "$PSQL -c \"ALTER ROLE $PG_USER WITH LOGIN SUPERUSER PASSWORD '$PG_PASS'\""
if ! su - postgres -c "$PSQL -tAc \"SELECT 1 FROM pg_database WHERE datname='$PG_DB'\"" | grep -q 1; then
  su - postgres -c "$PSQL -c \"CREATE DATABASE $PG_DB OWNER $PG_USER\""
fi

echo "==> Verifying extensions in $PG_DB"
su - postgres -c "$PSQL -d $PG_DB -c 'CREATE EXTENSION IF NOT EXISTS vector' -c 'CREATE EXTENSION IF NOT EXISTS pg_trgm' -c \"SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector','pg_trgm')\""

echo "==> Redis on :$REDIS_PORT"
redis-cli -p "$REDIS_PORT" ping

echo
echo "Done. From Windows: postgresql://$PG_USER:***@localhost:$PG_PORT/$PG_DB   redis://localhost:$REDIS_PORT"
