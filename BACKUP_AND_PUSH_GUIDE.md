# ZWS Cloud - Version Management & Backup Guide

## Overview

This guide explains how to use the two companion scripts for versioning releases and backing up sensitive files in the ZWS Cloud project.

## Prerequisites

- Git repository initialized and remote configured
- Bash shell
- `openssl` for encryption (included on most systems)
- `mysqldump` (optional, for database backups)
- Private GitHub repository

## Scripts

### 1. `push-version.sh` - Automated Version Release

This script automates the process of creating a new version release and pushing it to GitHub.

#### What it does:

1. Verifies git repository and remote exist
2. Fetches latest tags from remote
3. Auto-detects the current version (e.g., v0.5)
4. Increments patch version (v0.6)
5. Stages all tracked files
6. Creates a commit with message: `release: v0.6`
7. Creates an annotated git tag
8. Pushes both branch and tag to GitHub

#### Versioning Scheme:

- First release: `v0.1`
- Second release: `v0.2`
- Third release: `v0.3`
- Continues incrementing: `v0.4`, `v0.5`, etc.

#### Usage:

```bash
# Make script executable (first time only)
chmod +x push-version.sh

# Run the script
./push-version.sh
```

The script will:
1. Show you the current and next version
2. Display files that will be committed
3. Ask for confirmation before pushing
4. Push to your GitHub repository

#### Private Repository Warning:

The script includes a safety check for private repositories. It will warn you about ensuring sensitive files are in `.gitignore` before continuing.

#### Example Output:

```
╔══════════════════════════════════════════════════════════╗
║  ZWS Cloud - Versioned GitHub Push                     ║
╚══════════════════════════════════════════════════════════╝

→ Verifying git repository...
✓ Git repository found

→ Checking remote repository...
✓ Remote found: git@github.com:fitnesshubgym03-debug/zwscloud-ui-db.git

→ Detecting current version...
✓ Latest version: v0.1 → Next version: v0.2

Proceed with version v0.2? (y/n)
```

---

### 2. `backup-sensitive.sh` - Encrypted Sensitive File Backup

This script creates encrypted backups of all sensitive files including environment variables, keys, and database dumps.

#### What it backs up:

- **Environment files**: `.env`, `.env.local`, `.env.production`, `.env.development`
- **Cryptographic files**: `*.pem`, `*.key`, `*.crt`, `*.cert`, `*.pfx`
- **Database dumps**: MySQL database export (if credentials available)
- **Sensitive directories**: `secrets/`, `backups/`, `.ssh/`

#### Encryption:

- Uses **AES-256-CBC** encryption via OpenSSL
- Requires password entry (minimum 12 characters recommended)
- Creates timestamped, versioned archive: `zws-sensitive-YYYY-MM-DD-vX.X.tar.gz.enc`
- No plaintext backup files left behind

#### Usage:

```bash
# Make script executable (first time only)
chmod +x backup-sensitive.sh

# Run the script
./backup-sensitive.sh
```

The script will:
1. Collect all sensitive files
2. Create a temporary archive
3. Prompt for encryption password
4. Encrypt and compress the archive
5. Clean up temporary files
6. Save encrypted backup to `./secure-backups/`

#### Database Backup Support:

The script automatically backs up your MySQL database if `DATABASE_URL` is set in the environment. The database credentials are extracted from the URL and mysqldump is run (if available).

**Format expected**: `mysql://user:password@host:port/database`

#### Example Output:

```
╔══════════════════════════════════════════════════════════╗
║  ZWS Cloud - Encrypted Backup of Sensitive Files       ║
╚══════════════════════════════════════════════════════════╝

→ Collecting sensitive files...
  ✓ Added: .env
  ✓ Added: .env.local
  ✓ Added: secrets/api.key

→ Creating archive...
  ✓ Archive created

→ Encrypting backup...
  Please enter encryption password (minimum 12 characters):
  ✓ Backup encrypted and saved

╔════════════════════════════════════════════════════════╗
║  ✓ Backup completed successfully!                      ║
╚════════════════════════════════════════════════════════╝

  Location: ./secure-backups/zws-sensitive-2026-04-18-v0.3.tar.gz.enc
  Timestamp: 2026-04-18
  Version: v0.3
  Size: 1.2M
```

---

## Typical Workflow

### Release Process:

```bash
# 1. Make your code changes
# 2. Commit your changes to git
git add .
git commit -m "feat: add new feature"

# 3. Create encrypted backup of sensitive files
./backup-sensitive.sh
# (Enter your encryption password when prompted)

# 4. Create a version release and push to GitHub
./push-version.sh
# (Confirm the version number)

# 5. Verify the release on GitHub
# Visit: https://github.com/fitnesshubgym03-debug/zwscloud-ui-db/releases
```

### Restore Process:

```bash
# To restore from encrypted backup:

# 1. Decrypt the archive (you'll be prompted for the password)
openssl enc -aes-256-cbc -d -in secure-backups/zws-sensitive-2026-04-18-v0.3.tar.gz.enc -out zws-sensitive.tar.gz

# 2. Extract files
tar -xzf zws-sensitive.tar.gz

# 3. Copy environment files back
cp .env .env.local /path/to/project/

# 4. (Optional) Restore database
# Extract and run SQL dump
mysql -u your_user -p your_database < database_dump.sql
```

---

## .gitignore Protection

The project `.gitignore` has been configured to prevent accidentally committing:

- Environment files (`.env`, `.env.local`, etc.)
- Database files (`*.sql`, `*.sqlite`, `*.db`)
- Private keys and certificates (`*.pem`, `*.key`, `*.crt`)
- Backup directories
- Sensitive files in `secrets/`, `.ssh/` directories

**Always verify these files are in .gitignore before first push!**

```bash
# Check if .env is properly ignored
git check-ignore -v .env
# Should output: .env

# See what would be committed (should NOT include sensitive files)
git status
```

---

## Security Best Practices

1. **Backup Password**: Store your backup password in a secure password manager, NOT in the project
2. **Backup Storage**: Keep encrypted backups in a separate secure location (external drive, cloud storage, etc.)
3. **Private Repository**: Always keep your GitHub repository PRIVATE
4. **Never Commit Secrets**: Double-check `.gitignore` before any push
5. **Rotate Secrets**: Regularly update API keys, database passwords, etc.
6. **Test Restore**: Periodically test restoring from backups to ensure they work

---

## Troubleshooting

### Push script says "No existing tags found"

This is normal for a first release. The script will start with `v0.1`.

### Backup script says "No sensitive files found"

Make sure your `.env` or other secret files actually exist. The script only backs up files that are present.

### Cannot decrypt backup

```bash
# If you get decryption errors:
openssl enc -aes-256-cbc -d -in backup-file.enc -out output.tar.gz -md sha256

# Verify the file
file output.tar.gz
# Should show: gzip compressed data
```

### Database backup fails

```bash
# Check if mysqldump is available
which mysqldump

# If not installed:
# macOS:
brew install mysql

# Ubuntu/Debian:
sudo apt-get install mysql-client
```

### Permission denied when running scripts

```bash
# Make scripts executable
chmod +x push-version.sh
chmod +x backup-sensitive.sh

# Or for both
chmod +x *.sh
```

---

## Files Modified/Created

- ✓ `.gitignore` - Updated with sensitive file exclusions
- ✓ `push-version.sh` - New version release script
- ✓ `backup-sensitive.sh` - New encrypted backup script
- ✓ `BACKUP_GUIDE.md` - This documentation

---

## Additional Notes

- Encrypted backups are timestamped with the current date
- Version tags are automatically tagged with the git tag format `v0.x`
- Both scripts use color-coded output for clarity
- The push script will ask for confirmation before pushing
- The backup script will NOT commit plaintext backup files to git

---

## Contact & Support

For issues or questions about these scripts, please check:
1. The troubleshooting section above
2. GitHub repository issues
3. Project documentation

Remember: **Never store unencrypted sensitive backups in version control!**
