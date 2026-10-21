#!/usr/bin/env bash
# Disables the orphaned Actions workflow left behind when agent-pr.yml was removed.
# Requires: gh auth login   OR   GH_TOKEN with actions:write
set -euo pipefail

REPO="${GITHUB_REPOSITORY:-soumyadip007/AI-Driven-DevSecOps}"
ORPHAN_PATH=".github/workflows/agent-pr.yml"
KEEP_PATH=".github/workflows/security-agent-pr.yml"

if ! command -v gh >/dev/null 2>&1; then
  echo "Install GitHub CLI: brew install gh && gh auth login"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Not logged in. Run: gh auth login"
  exit 1
fi

echo "Workflows on $REPO:"
gh api "repos/$REPO/actions/workflows" --jq '.workflows[] | "\(.id)\t\(.state)\t\(.path)\t\(.name)"'

ORPHAN_ID=$(gh api "repos/$REPO/actions/workflows" \
  --jq ".workflows[] | select(.path==\"$ORPHAN_PATH\") | .id" | head -1)

if [[ -z "${ORPHAN_ID}" ]]; then
  echo "No orphan workflow at $ORPHAN_PATH — nothing to disable."
  exit 0
fi

echo "Disabling orphan workflow id=$ORPHAN_ID ($ORPHAN_PATH)..."
gh api -X PUT "repos/$REPO/actions/workflows/$ORPHAN_ID/disable"
echo "Disabled. Keep using: https://github.com/$REPO/actions/workflows/security-agent-pr.yml"
echo "Active file on main: $KEEP_PATH"
