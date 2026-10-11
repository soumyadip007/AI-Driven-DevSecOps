#!/usr/bin/env bash
# Local scanner harness — produces artifacts/ for the security agent
# and archives a full copy under artifacts/runs/<timestamp>/.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ART="$ROOT/artifacts"
FIX="$ROOT/fixtures/findings"
STAMP="$(date +%Y%m%d-%H%M%S)"
RUN_DIR="$ART/runs/$STAMP"

mkdir -p "$ART" "$RUN_DIR"

copy_fixture() {
  local name="$1"
  if [[ -f "$FIX/$name" ]]; then
    cp "$FIX/$name" "$ART/$name"
    echo "    (used fixture: fixtures/findings/$name)"
  else
    echo "    (no fixture available for $name)"
  fi
}

run_trivy() {
  # macOS often has neither GNU timeout nor gtimeout — call trivy directly.
  # With set -u, an empty array TIMER=() + "${TIMER[@]}" would crash.
  local out="$1"
  local target="$2"
  if command -v gtimeout >/dev/null 2>&1; then
    gtimeout 120 trivy fs \
      --severity CRITICAL,HIGH \
      --ignore-unfixed \
      --format json \
      --output "$out" \
      "$target"
    return $?
  fi
  if command -v timeout >/dev/null 2>&1; then
    timeout 120 trivy fs \
      --severity CRITICAL,HIGH \
      --ignore-unfixed \
      --format json \
      --output "$out" \
      "$target"
    return $?
  fi
  trivy fs \
    --severity CRITICAL,HIGH \
    --ignore-unfixed \
    --format json \
    --output "$out" \
    "$target"
}

echo "==> Scan run: $STAMP"
echo "    Archive: $RUN_DIR"
echo "    Latest:  $ART (for make agent)"

echo "==> Unit tests"
(
  cd "$ROOT/apps/vuln-shop"
  npm test
) | tee "$RUN_DIR/unit-tests.log"

echo "==> Semgrep (SAST)"
if command -v semgrep >/dev/null 2>&1; then
  set +e
  semgrep scan \
    --config "$ROOT/policies/semgrep" \
    --json \
    --output "$ART/semgrep.json" \
    "$ROOT/apps/vuln-shop" 2>&1 | tee "$RUN_DIR/semgrep.console.log"
  echo "Semgrep exit: $?"
  set -e
else
  echo "semgrep not installed"
  copy_fixture semgrep.json
fi

echo "==> Trivy (SCA)"
if command -v trivy >/dev/null 2>&1; then
  set +e
  run_trivy "$ART/trivy.json" "$ROOT/apps/vuln-shop"
  code=$?
  echo "Trivy exit: $code"
  if [[ $code -ne 0 && $code -ne 1 ]] || [[ ! -s "$ART/trivy.json" ]]; then
    echo "Trivy failed or timed out — falling back to fixture"
    copy_fixture trivy.json
  fi
  set -e
else
  echo "trivy not installed"
  copy_fixture trivy.json
fi

echo "==> Conftest (policy)"
if command -v conftest >/dev/null 2>&1; then
  set +e
  conftest test "$ROOT/apps/vuln-shop/Dockerfile" \
    --policy "$ROOT/policies/conftest" \
    --output json > "$ART/conftest.json"
  conftest test "$ROOT/apps/vuln-shop/Dockerfile" \
    --policy "$ROOT/policies/conftest" | tee "$ART/conftest.txt"
  echo "Conftest exit: $?"
  set -e
else
  echo "conftest not installed"
  copy_fixture conftest.json
  copy_fixture conftest.txt
fi

echo "==> Aggregate security-summary.json"
ARTIFACTS_DIR="$ART" node "$ROOT/scripts/aggregate-security-summary.js"

# Archive a full snapshot of this run (timestamped folder)
for f in semgrep.json trivy.json conftest.json conftest.txt security-summary.json; do
  if [[ -f "$ART/$f" ]]; then
    cp -f "$ART/$f" "$RUN_DIR/$f"
  fi
done

cat > "$RUN_DIR/README.txt" <<EOF
Scan archive
============
timestamp: $STAMP
created:   $(date -Iseconds 2>/dev/null || date)
host:      $(hostname 2>/dev/null || echo unknown)

This folder is a snapshot of scanner outputs from make scan.
The latest copies also live in artifacts/ for make agent.
EOF

# Pointer to newest run for convenience
ln -sfn "$STAMP" "$ART/runs/latest"

echo "Done."
echo "  Latest artifacts: $ART"
echo "  Timestamped run:  $RUN_DIR"
echo "  Latest symlink:   $ART/runs/latest -> $STAMP"
