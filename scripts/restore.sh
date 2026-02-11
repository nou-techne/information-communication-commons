#!/bin/bash
# Sprint 28: Backup Restore Script
# Restore commons.id database from encrypted backup

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <backup-file.sql.gpg.gz>"
  echo "Available backups:"
  ls -lh backups/*.sql.gpg.gz 2>/dev/null || echo "  (none found)"
  exit 1
fi

BACKUP_FILE="$1"
DB_HOST="db.hvbdpgkdcdskhpbdeeim.supabase.co"
DB_USER="postgres"
DB_NAME="postgres"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "[$(date)] Restoring from $BACKUP_FILE"
echo "WARNING: This will OVERWRITE the current database!"
read -p "Type 'YES' to continue: " confirm

if [ "$confirm" != "YES" ]; then
  echo "Restore cancelled."
  exit 0
fi

# Decompress
TEMP_FILE="${BACKUP_FILE%.gz}"
echo "[$(date)] Decompressing..."
gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"

# Decrypt if encrypted
if [[ "$TEMP_FILE" == *.gpg ]]; then
  if [ -z "$GPG_PASSPHRASE" ]; then
    read -sp "Enter GPG passphrase: " GPG_PASSPHRASE
    echo
  fi
  DECRYPTED_FILE="${TEMP_FILE%.gpg}"
  echo "$GPG_PASSPHRASE" | gpg --batch --yes --passphrase-fd 0 --decrypt "$TEMP_FILE" > "$DECRYPTED_FILE"
  rm "$TEMP_FILE"
  TEMP_FILE="$DECRYPTED_FILE"
  echo "[$(date)] Decrypted."
fi

# Restore database
echo "[$(date)] Restoring database..."
PGPASSWORD="${DB_PASSWORD}" psql \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  < "$TEMP_FILE"

# Cleanup
rm "$TEMP_FILE"

echo "[$(date)] Restore complete!"
echo "Verify with: psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c 'SELECT COUNT(*) FROM artifacts;'"
