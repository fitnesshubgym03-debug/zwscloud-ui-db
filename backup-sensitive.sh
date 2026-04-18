#!/bin/bash

###############################################################################
# ZWS Cloud - Encrypted Sensitive Files Backup Script
# 
# This script creates an encrypted backup of sensitive files including:
# - Environment files (.env, .env.*)
# - Database dumps
# - Private keys and certificates
# - Other confidential data
#
# Usage:
#   chmod +x backup-sensitive.sh
#   ./backup-sensitive.sh
#
# Output: zws-sensitive-YYYY-MM-DD-vX.X.tar.gz.enc
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./ secure-backups}"
PROJECT_ROOT="."
TIMESTAMP=$(date +%Y-%m-%d)
VERSION=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0")

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ZWS Cloud - Encrypted Backup of Sensitive Files       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if git is available
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}⚠ WARNING: git not found. Skipping version detection.${NC}"
    VERSION="v0.0"
fi

# Create temporary directory for collecting files
TEMP_BACKUP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_BACKUP_DIR" EXIT

echo -e "${BLUE}→ Collecting sensitive files...${NC}"

# Function to add file if it exists
add_file_if_exists() {
    local file=$1
    if [ -f "$PROJECT_ROOT/$file" ]; then
        mkdir -p "$TEMP_BACKUP_DIR/$(dirname "$file")"
        cp "$PROJECT_ROOT/$file" "$TEMP_BACKUP_DIR/$file"
        echo -e "  ${GREEN}✓${NC} Added: $file"
    fi
}

# Collect environment files
echo -e "${YELLOW}Scanning for environment files...${NC}"
add_file_if_exists ".env"
add_file_if_exists ".env.local"
add_file_if_exists ".env.production"
add_file_if_exists ".env.development"

# Collect certificates and keys
echo -e "${YELLOW}Scanning for cryptographic files...${NC}"
find "$PROJECT_ROOT" -maxdepth 2 \( -name "*.pem" -o -name "*.key" -o -name "*.crt" -o -name "*.pfx" \) 2>/dev/null | while read -r file; do
    relative_file="${file#$PROJECT_ROOT/}"
    mkdir -p "$TEMP_BACKUP_DIR/$(dirname "$relative_file")"
    cp "$file" "$TEMP_BACKUP_DIR/$relative_file"
    echo -e "  ${GREEN}✓${NC} Added: $relative_file"
done

# Optional: Database backup if credentials are available
if [ -n "$DATABASE_URL" ]; then
    echo -e "${YELLOW}Database credentials detected - attempting backup...${NC}"
    
    # Extract MySQL credentials from DATABASE_URL
    # Format: mysql://user:password@host:port/database
    if [[ $DATABASE_URL =~ mysql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
        
        # Check if mysqldump is available
        if command -v mysqldump &> /dev/null; then
            echo -e "  ${BLUE}Dumping database: $DB_NAME...${NC}"
            if MYSQL_PWD="$DB_PASS" mysqldump -u "$DB_USER" -h "$DB_HOST" -P "$DB_PORT" "$DB_NAME" > "$TEMP_BACKUP_DIR/database_dump.sql" 2>/dev/null; then
                echo -e "  ${GREEN}✓${NC} Added: database_dump.sql"
            else
                echo -e "  ${RED}✗${NC} Failed to dump database (check credentials)"
            fi
        else
            echo -e "  ${YELLOW}⚠${NC} mysqldump not available - skipping database backup"
        fi
    else
        echo -e "  ${YELLOW}⚠${NC} Could not parse DATABASE_URL format"
    fi
fi

# Check if there are any files to backup
if [ -z "$(find $TEMP_BACKUP_DIR -type f 2>/dev/null)" ]; then
    echo -e "${YELLOW}⚠ No sensitive files found to backup.${NC}"
    echo -e "${YELLOW}Make sure .env files and other secrets exist before running this script.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}→ Creating archive...${NC}"

# Create uncompressed tar first
TAR_FILE="$TEMP_BACKUP_DIR/../zws-sensitive-$TIMESTAMP-$VERSION.tar"
tar -cf "$TAR_FILE" -C "$TEMP_BACKUP_DIR" . 2>/dev/null || true

if [ ! -f "$TAR_FILE" ]; then
    echo -e "${RED}✗ Failed to create tar archive${NC}"
    exit 1
fi

echo -e "  ${GREEN}✓${NC} Archive created"

echo ""
echo -e "${BLUE}→ Encrypting backup...${NC}"
echo -e "${YELLOW}  Please enter encryption password (minimum 12 characters):${NC}"

# Encrypt using openssl
BACKUP_FILE="$BACKUP_DIR/zws-sensitive-$TIMESTAMP-$VERSION.tar.gz.enc"

if openssl enc -aes-256-cbc -salt -in "$TAR_FILE" -out "$BACKUP_FILE" -P -md sha256 2>/dev/null; then
    # Remove unencrypted tar file
    rm -f "$TAR_FILE"
    
    # Compress the encrypted file
    gzip -f "$BACKUP_FILE" 2>/dev/null || true
    
    echo -e "  ${GREEN}✓${NC} Backup encrypted and saved"
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ Backup completed successfully!                      ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${BLUE}Location:${NC} $BACKUP_FILE"
    echo -e "  ${BLUE}Timestamp:${NC} $TIMESTAMP"
    echo -e "  ${BLUE}Version:${NC} $VERSION"
    echo -e "  ${BLUE}Size:${NC} $(du -h "$BACKUP_FILE" 2>/dev/null | cut -f1)"
    echo ""
    echo -e "${YELLOW}⚠ Important:${NC}"
    echo -e "  - Keep your encryption password in a safe place"
    echo -e "  - This backup contains sensitive credentials"
    echo -e "  - Never commit this file to version control"
    echo ""
else
    echo -e "${RED}✗ Encryption failed${NC}"
    rm -f "$TAR_FILE" "$BACKUP_FILE"
    exit 1
fi

echo -e "${BLUE}→ Restore instructions:${NC}"
echo ""
echo "  To restore your backup, run:"
echo ""
echo "    # Decrypt the archive (enter your password when prompted)"
echo "    openssl enc -aes-256-cbc -d -in $BACKUP_FILE -out zws-sensitive.tar.gz"
echo ""
echo "    # Extract files"
echo "    tar -xzf zws-sensitive.tar.gz"
echo ""
echo "    # Copy files back to project"
echo "    cp .env .env.local /path/to/project/"
echo ""
echo "  Database restore:"
echo "    mysql -u user -p database_name < database_dump.sql"
echo ""
