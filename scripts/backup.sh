#!/bin/bash
# Sprint 28: Automated Backup
# Daily backup script for commons.id Supabase database
# Run via cron: 0 2 * * * /path/to/backup.sh

set -e

# Configuration
DB_HOST="db.hvbdpgkdcdskhpbdeeim.supabase.co"
DB_USER="postgres"
DB_NAME="postgres"
BACKUP_DIR="${BACKUP_DIR:-/root/.openclaw/workspace/information-communication-commons/backups}"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/commons-${DATE}.sql"
ENCRYPTED_FILE="${BACKUP_FILE}.gpg"
RETENTION_DAYS=30

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

# Dump database (use --no-sync to tolerate version mismatches)
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-acl \
  --no-sync \
  --format=plain \
  > "$BACKUP_FILE" 2>&1 || {
    echo "[$(date)] ERROR: pg_dump failed. Try installing PostgreSQL 17 client."
    echo "[$(date)] See: https://www.postgresql.org/download/linux/ubuntu/"
    exit 1
  }

echo "[$(date)] Database dumped to $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Encrypt backup (requires GPG_PASSPHRASE env var)
if [ -n "$GPG_PASSPHRASE" ]; then
  echo "$GPG_PASSPHRASE" | gpg --batch --yes --passphrase-fd 0 --symmetric --cipher-algo AES256 "$BACKUP_FILE"
  rm "$BACKUP_FILE"
  echo "[$(date)] Backup encrypted to $ENCRYPTED_FILE"
else
  echo "[$(date)] WARNING: GPG_PASSPHRASE not set, backup is unencrypted!"
fi

# Compress
gzip -f "$ENCRYPTED_FILE" 2>/dev/null || gzip -f "$BACKUP_FILE" 2>/dev/null || true

# Clean old backups
find "$BACKUP_DIR" -name "commons-*.sql.gpg.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "commons-*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

echo "[$(date)] Backup complete. Retained last $RETENTION_DAYS days."
echo "[$(date)] Backup size: $(du -h "$BACKUP_DIR" | tail -1 | cut -f1)"

# Optional: Upload to S3 (requires aws-cli configured)
if command -v aws &> /dev/null && [ -n "$S3_BUCKET" ]; then
  FINAL_FILE=$(ls -t "$BACKUP_DIR"/commons-*.gz | head -1)
  aws s3 cp "$FINAL_FILE" "s3://$S3_BUCKET/backups/$(basename "$FINAL_FILE")" --sse AES256
  echo "[$(date)] Uploaded to S3: $S3_BUCKET/backups/$(basename "$FINAL_FILE")"
fi
