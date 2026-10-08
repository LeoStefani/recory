#!/usr/bin/env bash
# Levanta un Postgres temporal, aplica las migraciones y corre las pruebas de seguridad y reglas.
# Requiere Postgres 15+ instalado (initdb, pg_ctl y psql en el PATH o en /usr/lib/postgresql/*/bin).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PGBIN="$(dirname "$(command -v initdb 2>/dev/null || ls -d /usr/lib/postgresql/*/bin/initdb | tail -1)")"
TMP="$(mktemp -d)"
RUN=""
if [ "$(id -u)" = "0" ]; then chown -R postgres "$TMP"; RUN="runuser -u postgres --"; fi
$RUN "$PGBIN/initdb" -D "$TMP/data" -A trust -U postgres >/dev/null
$RUN "$PGBIN/pg_ctl" -D "$TMP/data" -o "-k $TMP -h ''" -l "$TMP/log" -w start >/dev/null
trap '$RUN "$PGBIN/pg_ctl" -D "$TMP/data" -m immediate stop >/dev/null; rm -rf "$TMP"' EXIT
PSQL=(psql -h "$TMP" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -X)
"${PSQL[@]}" -f "$ROOT/tests/db/supabase_stub.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do "${PSQL[@]}" -f "$f"; done
"${PSQL[@]}" -f "$ROOT/tests/db/tests.sql"
echo "Pruebas de base de datos: OK"
