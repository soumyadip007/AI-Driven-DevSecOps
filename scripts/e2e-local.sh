#!/usr/bin/env bash
# End-to-end local demo path: world scan → agent heuristic → artifact layout checks.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> 1) make demo-reset (vulnerable baseline)"
make demo-reset || true

echo "==> 2) make scan → artifacts/world/"
make scan

test -s artifacts/world/security-summary.json
test -s artifacts/world/semgrep.json
test -d artifacts/world/runs/latest -o -L artifacts/world/runs/latest
echo "    world OK"

echo "==> 3) make agent-heuristic → artifacts/agent/"
make agent-heuristic

test -s artifacts/agent/evidence.md
test -s artifacts/agent/audit.jsonl
test -s artifacts/agent/products.remediated.js
test -d artifacts/agent/runs/latest -o -L artifacts/agent/runs/latest
echo "    agent OK"

echo "==> 4) Finding counts"
python3 - <<'PY'
import json
s=json.load(open("artifacts/world/security-summary.json"))
print("world findings:", s["counts"])
assert s["counts"]["total"] >= 1
PY

echo "==> 5) docs build (static outputs guide only)"
make docs

echo ""
echo "E2E local PASSED."
echo "  World:  artifacts/world/"
echo "  Agent:  artifacts/agent/"
echo "  CI:     download Artifacts 'world' / 'agent' from Actions runs"
echo "  Agent PR URL: https://github.com/soumyadip007/AI-Driven-DevSecOps/actions/workflows/security-agent-pr.yml"
echo ""
echo "Duplicate sidebar entry: disable OBSOLETE workflow at"
echo "  https://github.com/soumyadip007/AI-Driven-DevSecOps/actions/workflows/agent-pr.yml"
echo "  → ⋯ → Disable workflow"
