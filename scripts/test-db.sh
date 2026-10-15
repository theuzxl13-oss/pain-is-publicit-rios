#!/usr/bin/env bash
# Sobe um PostgreSQL descartável, aplica as migrations e executa supabase/tests/*.test.sql.
# Requer binários do PostgreSQL 16 (initdb, pg_ctl) com btree_gist, citext, pg_trgm, unaccent.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
PORT="${PGTEST_PORT:-54329}"
WORK="$(mktemp -d)"
RUN_AS=()
if [ "$(id -u)" = "0" ]; then
  chown postgres "$WORK"
  RUN_AS=(runuser -u postgres --)
fi

cleanup() {
  "${RUN_AS[@]}" "$PG_BIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

"${RUN_AS[@]}" "$PG_BIN/initdb" -D "$WORK/data" -U postgres -A trust >/dev/null
"${RUN_AS[@]}" "$PG_BIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -l "$WORK/log" -w start >/dev/null

PSQL=(psql -X -q -v ON_ERROR_STOP=1 -h "$WORK" -p "$PORT" -U postgres -d postgres)

"${PSQL[@]}" -f "$ROOT/supabase/tests/_supabase_stub.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ migration $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done

status=0
for t in "$ROOT"/supabase/tests/*.test.sql; do
  echo "→ teste $(basename "$t")"
  if ! "${PSQL[@]}" -o /dev/null -f "$t"; then
    status=1
  fi
done

if [ $status -eq 0 ]; then echo "✔ testes de banco aprovados"; else echo "✘ falhas nos testes de banco"; fi
exit $status
