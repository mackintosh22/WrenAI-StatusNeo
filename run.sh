#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# StatusNeo × Wren AI — one-command local spin up
#
#   ./run.sh            build Wren UI from source and start everything
#   ./run.sh down       stop the stack
#   ./run.sh logs [svc] follow logs
#   ./run.sh status     show container status
#   ./run.sh rebuild    force a clean rebuild of the Wren UI image
#   ./run.sh reset      stop and DELETE all data volumes
#
# Environment overrides: OPENAI_API_KEY, HOST_PORT, SKIP_KEY_CHECK=1
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$ROOT/docker"
COMPOSE_FILE="$DOCKER_DIR/docker-compose-local.yml"
ENV_FILE="$DOCKER_DIR/.env"
ENV_TEMPLATE="$DOCKER_DIR/.env.local.example"
CONFIG_FILE="$DOCKER_DIR/config.yaml"
CONFIG_TEMPLATE="$DOCKER_DIR/config.example.yaml"

Y=$'\033[33m'; R=$'\033[31m'; G=$'\033[32m'; D=$'\033[2m'; N=$'\033[0m'
say()  { printf '%s▸%s %s\n' "$Y" "$N" "$*"; }
ok()   { printf '%s✔%s %s\n' "$G" "$N" "$*"; }
die()  { printf '%s✖ %s%s\n' "$R" "$*" "$N" >&2; exit 1; }

# ---- docker / compose detection ------------------------------------------
command -v docker >/dev/null 2>&1 || die "Docker is not installed. Get it at https://docs.docker.com/get-docker/"
docker info >/dev/null 2>&1 || die "Docker daemon is not running. Start Docker and retry."
if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  die "Docker Compose not found. Install Docker Compose v2."
fi
dc() { "${COMPOSE[@]}" --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"; }

# helper: set KEY=VALUE in the env file (replace or append)
set_env() {
  local key="$1" val="$2" tmp
  tmp="$(mktemp)"
  if grep -qE "^${key}=" "$ENV_FILE"; then
    awk -v k="$key" -v v="$val" 'BEGIN{FS=OFS="="} $1==k{print k"="v; next} {print}' "$ENV_FILE" >"$tmp"
  else
    cat "$ENV_FILE" >"$tmp"; printf '%s=%s\n' "$key" "$val" >>"$tmp"
  fi
  mv "$tmp" "$ENV_FILE"
}
get_env() { grep -E "^$1=" "$ENV_FILE" | head -n1 | cut -d= -f2- || true; }

prepare() {
  mkdir -p "$DOCKER_DIR/data"

  if [ ! -f "$ENV_FILE" ]; then
    say "Creating docker/.env from template"
    cp "$ENV_TEMPLATE" "$ENV_FILE"
  fi

  # CPU architecture
  case "$(uname -m)" in
    arm64|aarch64) set_env PLATFORM linux/arm64 ;;
    *)             set_env PLATFORM linux/amd64 ;;
  esac

  # anonymous user id
  if [ -z "$(get_env USER_UUID)" ]; then
    if command -v uuidgen >/dev/null 2>&1; then
      set_env USER_UUID "$(uuidgen | tr 'A-Z' 'a-z')"
    else
      set_env USER_UUID "$(cat /proc/sys/kernel/random/uuid 2>/dev/null || date +%s)"
    fi
  fi

  # optional port override
  [ -n "${HOST_PORT:-}" ] && set_env HOST_PORT "$HOST_PORT"

  # AI service config
  if [ ! -f "$CONFIG_FILE" ]; then
    say "Creating docker/config.yaml from template"
    cp "$CONFIG_TEMPLATE" "$CONFIG_FILE"
  fi

  # OpenAI key
  if [ -n "${OPENAI_API_KEY:-}" ]; then
    set_env OPENAI_API_KEY "$OPENAI_API_KEY"
  fi
  if [ -z "$(get_env OPENAI_API_KEY)" ] && [ "${SKIP_KEY_CHECK:-0}" != "1" ]; then
    if [ -t 0 ]; then
      printf '%sOpenAI API key%s (needed for natural-language features; input hidden): ' "$Y" "$N"
      read -rs key; echo
      [ -n "$key" ] || die "No key entered. Re-run with OPENAI_API_KEY=sk-... ./run.sh (or SKIP_KEY_CHECK=1)."
      set_env OPENAI_API_KEY "$key"
    else
      die "OPENAI_API_KEY is not set. Run: OPENAI_API_KEY=sk-... ./run.sh (or SKIP_KEY_CHECK=1 to skip)."
    fi
  fi
}

wait_for_ui() {
  local port url i
  port="$(get_env HOST_PORT)"; port="${port:-3000}"
  url="http://localhost:${port}/"
  say "Waiting for the UI at $url (first start runs DB migrations)…"
  for i in $(seq 1 90); do
    if curl -fsS -o /dev/null "$url" 2>/dev/null; then
      ok "StatusNeo × Wren AI is up →  $url"
      printf '%s   Landing page: %s   |   Workspace: %slaunch%s\n' "$D" "$url" "$url" "$N"
      return 0
    fi
    sleep 2
  done
  die "UI did not become ready in time. Check: ./run.sh logs wren-ui"
}

cmd="${1:-up}"
case "$cmd" in
  up)
    prepare
    say "Building Wren UI from source and starting the stack (first build takes a few minutes; needs ~8 GB RAM for Docker)…"
    dc up -d --build
    wait_for_ui
    ;;
  rebuild)
    prepare
    say "Rebuilding Wren UI image without cache…"
    dc build --no-cache wren-ui
    dc up -d
    wait_for_ui
    ;;
  down)   [ -f "$ENV_FILE" ] || die "Nothing to stop (docker/.env missing)."; dc down ;;
  logs)   [ -f "$ENV_FILE" ] || die "docker/.env missing."; shift || true; dc logs -f --tail=200 "$@" ;;
  status) [ -f "$ENV_FILE" ] || die "docker/.env missing."; dc ps ;;
  reset)
    [ -f "$ENV_FILE" ] || die "docker/.env missing."
    printf 'This deletes ALL Wren data volumes. Continue? [y/N] '; read -r a
    [ "$a" = "y" ] || [ "$a" = "Y" ] || exit 0
    dc down -v
    ;;
  -h|--help|help) sed -n '2,15p' "$0" ;;
  *) die "Unknown command '$cmd'. Use: up | down | logs | status | rebuild | reset" ;;
esac
