#!/usr/bin/env bash
# Local scanner harness — writes into artifacts/world/ (vulnerability analysis)
# and archives under artifacts/world/runs/<timestamp>/.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORLD="$ROOT/artifacts/world"
FIX="$ROOT/fixtures/findings"
STAMP="$(date +%Y%m%d-%H%M%S)"
RUN_DIR="$WORLD/runs/$STAMP"

mkdir -p "$WORLD" "$RUN_DIR"

copy_fixture() {
  local name="$1"
  if [[ -f "$FIX/$name" ]]; then
    cp "$FIX/$name" "$WORLD/$name"
    echo "    (used fixture: fixtures/findings/$name)"
  else
    echo "    (no fixture available for $name)"
  fi
}

run_trivy() {
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

echo "==> World scan run: $STAMP"
echo "    Archive: $RUN_DIR"
echo "    Latest:  $WORLD (Security CI / make scan)"

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
    --output "$WORLD/semgrep.json" \
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
  run_trivy "$WORLD/trivy.json" "$ROOT/apps/vuln-shop"
  code=$?
  echo "Trivy exit: $code"
  if [[ $code -ne 0 && $code -ne 1 ]] || [[ ! -s "$WORLD/trivy.json" ]]; then
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
    --output json > "$WORLD/conftest.json"
  conftest test "$ROOT/apps/vuln-shop/Dockerfile" \
    --policy "$ROOT/policies/conftest" | tee "$WORLD/conftest.txt"
  echo "Conftest exit: $?"
  set -e
else
  echo "conftest not installed"
  copy_fixture conftest.json
  copy_fixture conftest.txt
fi

echo "==> Aggregate security-summary.json → artifacts/world/"
ARTIFACTS_DIR="$WORLD" node "$ROOT/scripts/aggregate-security-summary.js"

for f in semgrep.json trivy.json conftest.json conftest.txt security-summary.json; do
  if [[ -f "$WORLD/$f" ]]; then
    cp -f "$WORLD/$f" "$RUN_DIR/$f"
  fi
done

cat > "$RUN_DIR/README.txt" <<EOF
World scan archive (vulnerability analysis)
==========================================
timestamp: $STAMP
created:   $(date -Iseconds 2>/dev/null || date)
host:      $(hostname 2>/dev/null || echo unknown)

Scanner outputs for Security CI / make scan.
Latest copies: artifacts/world/
Agent reads:   artifacts/world/security-summary.json
EOF

ln -sfn "$STAMP" "$WORLD/runs/latest"

# Sync published docs snapshots (for GitHub Pages)
if [[ -x "$ROOT/scripts/sync-docs-outputs.sh" ]] || [[ -f "$ROOT/scripts/sync-docs-outputs.sh" ]]; then
  bash "$ROOT/scripts/sync-docs-outputs.sh" world || true
fi

echo "Done."
echo "  World latest:     $WORLD"
echo "  Timestamped run:  $RUN_DIR"
echo "  Latest symlink:   $WORLD/runs/latest -> $STAMP"
