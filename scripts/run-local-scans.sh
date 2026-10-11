#!/usr/bin/env bash
# Local scanner harness — produces artifacts/ for the security agent.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ART="$ROOT/artifacts"
FIX="$ROOT/fixtures/findings"
mkdir -p "$ART"

copy_fixture() {
  local name="$1"
  if [[ -f "$FIX/$name" ]]; then
    cp "$FIX/$name" "$ART/$name"
    echo "    (used fixture: fixtures/findings/$name)"
  else
    echo "    (no fixture available for $name)"
  fi
}

echo "==> Unit tests"
(
  cd "$ROOT/apps/vuln-shop"
  npm test
)

echo "==> Semgrep (SAST)"
if command -v semgrep >/dev/null 2>&1; then
  set +e
  semgrep scan \
    --config "$ROOT/policies/semgrep" \
    --json \
    --output "$ART/semgrep.json" \
    "$ROOT/apps/vuln-shop"
  echo "Semgrep exit: $?"
  set -e
else
  echo "semgrep not installed"
  copy_fixture semgrep.json
fi

echo "==> Trivy (SCA)"
if command -v trivy >/dev/null 2>&1; then
  set +e
  # First DB download can be slow/flaky on conference Wi‑Fi — bound it.
  if command -v gtimeout >/dev/null 2>&1; then
    TIMER=(gtimeout 120)
  elif command -v timeout >/dev/null 2>&1; then
    TIMER=(timeout 120)
  else
    TIMER=()
  fi
  "${TIMER[@]}" trivy fs \
    --severity CRITICAL,HIGH \
    --ignore-unfixed \
    --format json \
    --output "$ART/trivy.json" \
    "$ROOT/apps/vuln-shop"
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
node "$ROOT/scripts/aggregate-security-summary.js"

echo "Done. Artifacts in $ART"
