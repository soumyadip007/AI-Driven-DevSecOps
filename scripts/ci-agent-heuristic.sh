#!/usr/bin/env bash
# CI entrypoint: run security-agent in heuristic mode (no LLM) and
# materialize remediations + evidence for a GitHub PR.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p artifacts reports/security-agent

if [[ ! -s artifacts/security-summary.json ]]; then
  echo "No artifacts/security-summary.json — seeding from fixtures/findings"
  cp fixtures/findings/* artifacts/ 2>/dev/null || true
  node scripts/aggregate-security-summary.js
fi

echo "==> Running agent-heuristic (LLM=none) with --apply"
node agents/security-agent/src/cli.js \
  --summary artifacts/security-summary.json \
  --out agents/security-agent/out \
  --llm none \
  --apply

echo "==> Refresh lockfile after lodash bump (if any)"
(
  cd apps/vuln-shop
  npm install --package-lock-only --ignore-scripts
)

echo "==> Copy evidence into reports/ (committed on the PR branch)"
# Prefer timestamped archive if present; fall back to out/
SRC="agents/security-agent/out"
if [[ -L agents/security-agent/out/runs/latest || -d agents/security-agent/out/runs/latest ]]; then
  SRC="agents/security-agent/out/runs/latest"
elif [[ -f agents/security-agent/out/runs/latest.txt ]]; then
  SRC="agents/security-agent/out/runs/$(cat agents/security-agent/out/runs/latest.txt | tr -d '\n')"
fi
echo "    Evidence source: $SRC"

cp -f "$SRC/evidence.md" reports/security-agent/evidence.md
cp -f "$SRC/plan.json" reports/security-agent/plan.json
cp -f "$SRC/correlation.json" reports/security-agent/correlation.json
cp -f "$SRC/remediations.json" reports/security-agent/remediations.json
cp -f "$SRC/audit.jsonl" reports/security-agent/audit.jsonl
cp -f artifacts/security-summary.json reports/security-agent/security-summary.json
# Preserve which agent run this PR came from
if [[ -f "$SRC/README.txt" ]]; then
  cp -f "$SRC/README.txt" reports/security-agent/agent-run.txt
fi
# Also copy a dated snapshot into reports for distinction in the PR
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "reports/security-agent/runs/$STAMP"
cp -f reports/security-agent/*.md reports/security-agent/*.json reports/security-agent/*.jsonl reports/security-agent/*.txt \
  "reports/security-agent/runs/$STAMP/" 2>/dev/null || true
ln -sfn "$STAMP" reports/security-agent/runs/latest || true
echo "    PR report archive: reports/security-agent/runs/$STAMP"

# PR body for create-pull-request / gh
cat > reports/security-agent/pr-body.md <<'EOF'
## Security agent remediation (CI)

This pull request was **opened automatically by GitHub Actions** after running:

```bash
make agent-heuristic   # equivalent: --llm none --apply
```

### How this was created

1. CI loaded `artifacts/security-summary.json` (from the security workflow or fixtures).
2. The **bounded security agent** ran in **heuristic mode** (no LLM / no Ollama).
3. It proposed and applied remediations for SAST (SQL), SCA (`lodash`), and Dockerfile policy.
4. Evidence was written under `reports/security-agent/`.

### Important (demo / HIL)

- **Scanners are the source of truth** (Semgrep / Trivy / Conftest).
- The agent **does not merge** — humans review and approve.
- Local talks can also run `make agent` with **Ollama** for an LLM audience briefing; this CI path stays deterministic for reliability.

### Review checklist

- [ ] Read `reports/security-agent/evidence.md`
- [ ] Diff SQL fix, dependency bump, Dockerfile harden
- [ ] Confirm CI security jobs / re-scan look good on this branch
- [ ] Approve merge only if residual risk is accepted

EOF

# Append a short evidence excerpt
{
  echo ""
  echo "### Evidence excerpt"
  echo ""
  echo '```'
  head -n 80 reports/security-agent/evidence.md
  echo '```'
} >> reports/security-agent/pr-body.md

echo "Done. Remediations applied; reports ready for PR."
