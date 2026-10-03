#!/bin/bash
# cron: 17 4 * * * /root/mom_site_backup.sh >> /var/log/mom_site_backup.log 2>&1
set -euo pipefail
DIR=/root/backups/mom_site
KEEP=14
set -a; . /root/mom_site/.env; set +a
mkdir -p "$DIR"
F="$DIR/mom_site_$(date +%F_%H%M).sql.gz"
docker run --rm -e PGPASSWORD="$POSTGRES_PASSWORD" postgres:17-alpine \
  pg_dump -h 188.225.75.81 -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges \
  | gzip -9 > "$F"
[ -s "$F" ] || { echo "empty dump" >&2; rm -f "$F"; exit 1; }
ls -1t "$DIR"/mom_site_*.sql.gz | tail -n +$((KEEP+1)) | xargs -r rm -f
find /root/backups -maxdepth 1 -type f \( -name 'pre-*.dump' -o -name 'mom_site_pre_*.sql.gz' \) -mtime +30 -delete
echo "$(date -Is) ok $(du -h "$F" | cut -f1) $F"
