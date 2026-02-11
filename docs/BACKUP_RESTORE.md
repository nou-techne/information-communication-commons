# Backup & Restore — Sprint 28

## Overview

commons.id uses **nightly automated backups** with encryption and optional S3 upload.

**Backup strategy:**
- **Frequency:** Daily at 2:00 AM UTC via cron
- **Retention:** 30 days local, indefinite S3 (lifecycle rules recommended)
- **Encryption:** AES256 via GPG symmetric encryption
- **Format:** Plain SQL dump (human-readable, easy to audit)
- **Storage:** Local filesystem + optional S3 bucket

**Supabase built-in backups:**
- Point-in-Time Recovery (PITR) available in Supabase dashboard (Pro plan required)
- Daily backups retained for 7 days by default
- Our custom backup script complements this with longer retention and offline storage

---

## Setup

### 1. Install Dependencies

```bash
# PostgreSQL 17 client tools (REQUIRED — pg_dump version must match server)
# Supabase runs PostgreSQL 17.6, so we need matching client tools

# Add PostgreSQL APT repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update

# Install PostgreSQL 17 client
sudo apt install postgresql-client-17

# Verify version
pg_dump --version  # Should show 17.x

# GPG for encryption (usually pre-installed)
which gpg || sudo apt install gnupg

# AWS CLI for S3 upload (optional)
which aws || pip install awscli
```

### 2. Environment Variables

Create `.env.backup` in project root:

```bash
# Database credentials (same as .env)
DB_PASSWORD="ZIOQ#Ebe8q&bvnO*"

# Encryption passphrase (REQUIRED for production)
GPG_PASSPHRASE="your-strong-passphrase-here"

# Optional: S3 backup destination
S3_BUCKET="commons-backups"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_DEFAULT_REGION="us-east-1"
```

### 3. Make Scripts Executable

```bash
chmod +x scripts/backup.sh scripts/restore.sh
```

### 4. Set Up Cron Job

```bash
crontab -e

# Add this line (runs daily at 2 AM UTC):
0 2 * * * cd /root/.openclaw/workspace/information-communication-commons && source .env.backup && ./scripts/backup.sh >> logs/backup.log 2>&1
```

---

## Manual Backup

```bash
# Source environment variables
source .env.backup

# Run backup
./scripts/backup.sh
```

Output: `backups/commons-YYYY-MM-DD_HH-MM-SS.sql.gpg.gz`

---

## Restore from Backup

### List Available Backups

```bash
ls -lh backups/
```

### Restore Procedure

```bash
# Source environment (for DB password and GPG passphrase)
source .env.backup

# Run restore script
./scripts/restore.sh backups/commons-2026-02-11_02-00-00.sql.gpg.gz
```

**⚠️ WARNING:** This **overwrites** the current database. Confirm with `YES` when prompted.

### Verification

```bash
# Check artifact count
PGPASSWORD="$DB_PASSWORD" psql -h db.hvbdpgkdcdskhpbdeeim.supabase.co -U postgres -d postgres \
  -c "SELECT COUNT(*) AS artifacts FROM artifacts;"

# Check recent contributions
PGPASSWORD="$DB_PASSWORD" psql -h db.hvbdpgkdcdskhpbdeeim.supabase.co -U postgres -d postgres \
  -c "SELECT id, created_at, status FROM contributions ORDER BY created_at DESC LIMIT 5;"
```

---

## Testing the Backup/Restore Cycle

### 1. Create Test Backup

```bash
./scripts/backup.sh
```

Verify file exists: `ls -lh backups/ | tail -1`

### 2. Record Current State

```bash
# Count artifacts before restore
PGPASSWORD="$DB_PASSWORD" psql -h db.hvbdpgkdcdskhpbdeeim.supabase.co -U postgres -d postgres \
  -c "SELECT COUNT(*) FROM artifacts;" > /tmp/before.txt
```

### 3. Restore from Backup

```bash
./scripts/restore.sh backups/commons-*.sql.gpg.gz
```

### 4. Verify State Matches

```bash
PGPASSWORD="$DB_PASSWORD" psql -h db.hvbdpgkdcdskhpbdeeim.supabase.co -U postgres -d postgres \
  -c "SELECT COUNT(*) FROM artifacts;" > /tmp/after.txt

diff /tmp/before.txt /tmp/after.txt && echo "✓ Restore successful" || echo "✗ Mismatch detected"
```

---

## S3 Upload (Optional)

### Configure AWS CLI

```bash
aws configure
# AWS Access Key ID: ...
# AWS Secret Access Key: ...
# Default region: us-east-1
# Default output format: json
```

### Create S3 Bucket

```bash
aws s3 mb s3://commons-backups
aws s3api put-bucket-encryption \
  --bucket commons-backups \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

### Enable Lifecycle Policy (Delete after 90 days)

```bash
cat > lifecycle.json <<EOF
{
  "Rules": [{
    "Id": "DeleteOldBackups",
    "Status": "Enabled",
    "Prefix": "backups/",
    "Expiration": { "Days": 90 }
  }]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket commons-backups \
  --lifecycle-configuration file://lifecycle.json
```

Backup script will automatically upload if `S3_BUCKET` is set.

---

## Monitoring

### Check Last Backup

```bash
ls -lht backups/ | head -2
```

### View Backup Log

```bash
tail -50 logs/backup.log
```

### Backup Size Trend

```bash
du -h backups/ | tail -1
```

---

## Security Notes

1. **Never commit `.env.backup`** — it contains database password and encryption passphrase
2. **Use strong GPG passphrase** — minimum 20 characters, mixed case + symbols
3. **Rotate credentials quarterly** — update database password and GPG passphrase
4. **S3 bucket access** — restrict to backup IAM user only, enable versioning
5. **Test restore monthly** — ensure backups are actually recoverable

---

## Troubleshooting

### Backup fails with "permission denied"

```bash
chmod +x scripts/backup.sh
```

### GPG decryption fails

- Ensure `GPG_PASSPHRASE` in `.env.backup` matches the passphrase used during backup
- Check passphrase has no trailing whitespace

### Restore hangs or times out

- Check database connection: `psql -h db.hvbdpgkdcdskhpbdeeim.supabase.co -U postgres -d postgres -c '\dt'`
- Large restores may take 5-10 minutes

### S3 upload fails

```bash
aws s3 ls s3://commons-backups/backups/ --region us-east-1
```

Check IAM permissions: `s3:PutObject`, `s3:PutObjectAcl`

---

## Acceptance Criteria ✅

- [x] Backup script created and executable
- [x] Restore script created and tested
- [x] Encryption with GPG AES256
- [x] 30-day local retention
- [x] Optional S3 upload with lifecycle policy
- [x] Documentation complete
- [ ] Cron job configured (requires Todd to enable)
- [ ] Monthly restore drill scheduled

**Status:** Sprint 28 complete. Backup infrastructure ready. Cron setup requires host access.
