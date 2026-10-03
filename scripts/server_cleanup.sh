#!/bin/bash
# cron: 40 4 * * 0 /root/server_cleanup.sh >> /var/log/server_cleanup.log 2>&1
set -uo pipefail
before=$(df --output=avail -BM / | tail -1)
docker builder prune -af --filter until=168h >/dev/null
docker image prune -af --filter until=168h >/dev/null
journalctl --vacuum-size=200M >/dev/null 2>&1
find /var/log -type f -name '*.gz' -mtime +30 -delete
after=$(df --output=avail -BM / | tail -1)
echo "$(date -Is) cleanup free: $before -> $after"
