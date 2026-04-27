#!/usr/bin/env bash
#
# Runs on the production server. Invoked by .github/workflows/deploy.yml.
# Idempotent: checks out a specific git SHA, rebuilds & restarts the docker
# stack defined by docker-compose.prod.yml, waits for healthchecks, and
# verifies the public endpoint.
#
# Argument: GIT_SHA — the commit to deploy.

set -euo pipefail

GIT_SHA="${1:?usage: deploy_remote.sh <git-sha>}"
REPO_DIR="${REPO_DIR:-/root/mom_site}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
PUBLIC_URL="${PUBLIC_URL:-https://angelamoiseenko.ru/}"
HEALTH_TIMEOUT_SECS="${HEALTH_TIMEOUT_SECS:-300}"

log() { printf '\n==> %s\n' "$*"; }

cd "$REPO_DIR"

log "current state before deploy"
git --no-pager log -1 --format='HEAD = %H %s'
docker compose -f "$COMPOSE_FILE" ps --format 'table {{.Name}}\t{{.Status}}' || true

log "fetching $GIT_SHA"
git fetch --prune origin

if ! git cat-file -e "$GIT_SHA^{commit}" 2>/dev/null; then
  echo "commit $GIT_SHA not found in repo after fetch" >&2
  exit 1
fi

log "checking out $GIT_SHA on main"
git checkout main
git reset --hard "$GIT_SHA"
git --no-pager log -1 --format='now at %H %s'

log "building & (re)starting containers"
docker compose -f "$COMPOSE_FILE" up -d --build --remove-orphans

log "waiting for healthchecks (timeout ${HEALTH_TIMEOUT_SECS}s)"
deadline=$(( $(date +%s) + HEALTH_TIMEOUT_SECS ))
while true; do
  status=$(docker compose -f "$COMPOSE_FILE" ps --format '{{.Name}} {{.Status}}')
  printf '%s\n' "$status"
  # all containers must be Up and (healthy) — fail fast on unhealthy
  if printf '%s\n' "$status" | grep -q 'unhealthy'; then
    echo "a container is unhealthy" >&2
    docker compose -f "$COMPOSE_FILE" logs --tail=80 >&2 || true
    exit 1
  fi
  if ! printf '%s\n' "$status" | grep -qE '(starting|Restarting|Created)'; then
    # everything either has (healthy) or has no healthcheck
    if ! printf '%s\n' "$status" | grep -qv '(healthy)'; then
      echo "all containers healthy"
      break
    fi
    # accept services without healthcheck if they're Up
    if printf '%s\n' "$status" | grep -qE '^(\S+) Up'; then
      echo "all containers Up"
      break
    fi
  fi
  if [ "$(date +%s)" -ge "$deadline" ]; then
    echo "healthcheck timeout" >&2
    docker compose -f "$COMPOSE_FILE" logs --tail=80 >&2 || true
    exit 1
  fi
  sleep 5
done

log "public endpoint check ($PUBLIC_URL)"
for i in 1 2 3 4 5; do
  if curl -fsSI --max-time 15 "$PUBLIC_URL" | head -1; then
    echo "public endpoint responded"
    break
  fi
  echo "attempt $i failed, retrying..."
  sleep 5
  [ "$i" = "5" ] && { echo "public endpoint never responded" >&2; exit 1; }
done

log "pruning dangling images (safe — does not affect tagged images)"
docker image prune -f

log "deploy complete: $GIT_SHA"
