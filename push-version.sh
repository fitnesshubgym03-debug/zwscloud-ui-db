#!/bin/bash

###############################################################################
# ZWS Cloud - Versioned GitHub Push Script
#
# This script:
# - Verifies git repository and remote exist
# - Detects the latest version tag (v0.x format)
# - Increments patch version automatically
# - Commits code changes with version message
# - Creates and pushes annotated git tag
#
# Usage:
#   chmod +x push-version.sh
#   ./push-version.sh
#
# Environment:
#   GITHUB_REPO_PRIVATE - Optional: Set to "true" to verify private repo (default: true)
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GITHUB_REPO_PRIVATE="${GITHUB_REPO_PRIVATE:-true}"
PROJECT_ROOT="."

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ZWS Cloud - Versioned GitHub Push                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to exit with error
error() {
    echo -e "${RED}✗ Error: $1${NC}"
    exit 1
}

# Function for info message
info() {
    echo -e "${BLUE}→ $1${NC}"
}

# Function for success message
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function for warning
warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Step 1: Verify git repository exists
info "Verifying git repository..."
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    error "No git repository found in $PROJECT_ROOT"
fi
success "Git repository found"
echo ""

# Step 2: Verify remote repository exists
info "Checking remote repository..."
if ! git -C "$PROJECT_ROOT" remote get-url origin &>/dev/null; then
    error "No remote 'origin' configured"
fi

REMOTE_URL=$(git -C "$PROJECT_ROOT" remote get-url origin)
success "Remote found: $REMOTE_URL"
echo ""

# Step 3: Check if repository is private
if [ "$GITHUB_REPO_PRIVATE" = "true" ]; then
    warning "Repository is configured as PRIVATE"
    warning "Verify that sensitive files are in .gitignore"
    echo ""
    read -p "Continue with PRIVATE repository? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
fi

echo ""

# Step 4: Fetch latest tags
info "Fetching latest tags from remote..."
git -C "$PROJECT_ROOT" fetch --tags 2>/dev/null || warning "Could not fetch tags (network issue?)"
success "Tags fetched"
echo ""

# Step 5: Detect current version
info "Detecting current version..."

# Get the latest tag matching v0.x pattern
LATEST_TAG=$(git -C "$PROJECT_ROOT" tag -l "v0.*" --sort=-v:refname 2>/dev/null | head -1 || true)

if [ -z "$LATEST_TAG" ]; then
    # No tags exist, start from v0.1
    NEW_VERSION="v0.1"
    success "No existing tags found - starting with $NEW_VERSION"
else
    # Extract patch number and increment
    PATCH=$(echo "$LATEST_TAG" | sed 's/v0\.//')
    NEW_PATCH=$((PATCH + 1))
    NEW_VERSION="v0.$NEW_PATCH"
    success "Latest version: $LATEST_TAG → Next version: $NEW_VERSION"
fi

echo ""

# Step 6: Check for uncommitted changes
info "Checking for changes..."
if ! git -C "$PROJECT_ROOT" diff-index --quiet HEAD --; then
    info "Found uncommitted changes"
    git -C "$PROJECT_ROOT" status --short | head -10
else
    warning "No uncommitted changes detected"
fi
echo ""

# Step 7: Show what will be committed
info "Files to be committed:"
CHANGED_FILES=$(git -C "$PROJECT_ROOT" diff --cached --name-only 2>/dev/null | wc -l)
if [ "$CHANGED_FILES" -gt 0 ]; then
    git -C "$PROJECT_ROOT" diff --cached --name-only | head -10
    if [ "$CHANGED_FILES" -gt 10 ]; then
        echo "... and $((CHANGED_FILES - 10)) more files"
    fi
else
    warning "No staged changes. Using: git add ."
fi

echo ""

# Step 8: Confirmation before commit
read -p "Proceed with version $NEW_VERSION? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""

# Step 9: Stage all tracked files (excluding .gitignore)
info "Staging tracked files..."
git -C "$PROJECT_ROOT" add -A --intent-to-add 2>/dev/null || true
git -C "$PROJECT_ROOT" add -u 2>/dev/null || true
success "Files staged"
echo ""

# Step 10: Create commit
info "Creating commit: release: $NEW_VERSION"
COMMIT_MESSAGE="release: $NEW_VERSION"

if git -C "$PROJECT_ROOT" commit -m "$COMMIT_MESSAGE" 2>/dev/null; then
    success "Commit created"
else
    warning "Nothing to commit (working tree clean)"
fi

echo ""

# Step 11: Create annotated tag
info "Creating annotated tag: $NEW_VERSION"
if git -C "$PROJECT_ROOT" tag -a "$NEW_VERSION" -m "Release $NEW_VERSION" 2>/dev/null; then
    success "Tag created"
else
    error "Failed to create tag"
fi

echo ""

# Step 12: Push to remote
info "Pushing to remote..."

# Get current branch
CURRENT_BRANCH=$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD)

if git -C "$PROJECT_ROOT" push origin "$CURRENT_BRANCH" 2>&1; then
    success "Branch pushed to origin"
else
    warning "Could not push branch (network issue?)"
fi

if git -C "$PROJECT_ROOT" push origin "$NEW_VERSION" 2>&1; then
    success "Tag pushed to origin"
else
    warning "Could not push tag (network issue?)"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ Version release completed!                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}Version:${NC} $NEW_VERSION"
echo -e "  ${BLUE}Branch:${NC} $CURRENT_BRANCH"
echo -e "  ${BLUE}Repository:${NC} $REMOTE_URL"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Verify the push at: ${REMOTE_URL%.*}/releases/tag/$NEW_VERSION"
echo -e "  2. Create a GitHub Release with changelog"
echo -e "  3. Backup sensitive files (run: ./backup-sensitive.sh)"
echo ""
