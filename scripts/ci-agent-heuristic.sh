#!/usr/bin/env bash
# CI entrypoint: heuristic agent (no LLM) → artifacts/agent + docs/outputs + PR body.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p artifacts/world artifacts/agent reports/security-agent

if [[ ! -s artifacts/world/security-summary.json ]]; then
  echo "No artifacts/world/security-summary.json — seeding from fixtures/findings"
  cp fixtures/findings/* artifacts/world/ 2>/dev/null || true
  ARTIFACTS_DIR=artifacts/world node scripts/aggregate-security-summary.js
fi

echo "==> Running agent-heuristic (LLM=none) with --apply"
node agents/security-agent/src/cli.js \
  --summary artifacts/world/security-summary.json \
  --out artifacts/agent \
  --llm none \
  --apply

echo "==> Refresh lockfile after lodash bump (if any)"
(
  cd apps/vuln-shop
  npm install --package-lock-only --ignore-scripts
)

echo "==> Copy evidence into reports/ (committed on the PR branch)"
SRC="artifacts/agent"
if [[ -L artifacts/agent/runs/latest || -d artifacts/agent/runs/latest ]]; then
  SRC="artifacts/agent/runs/latest"
elif [[ -f artifacts/agent/runs/latest.txt ]]; then
  SRC="artifacts/agent/runs/$(tr -d '\n' < artifacts/agent/runs/latest.txt)"
fi
echo "    Evidence source: $SRC"

cp -f "$SRC/evidence.md" reports/security-agent/evidence.md
cp -f "$SRC/plan.json" reports/security-agent/plan.json
cp -f "$SRC/correlation.json" reports/security-agent/correlation.json
cp -f "$SRC/remediations.json" reports/security-agent/remediations.json
cp -f "$SRC/audit.jsonl" reports/security-agent/audit.jsonl
cp -f artifacts/world/security-summary.json reports/security-agent/security-summary.json
[[ -f "$SRC/README.txt" ]] && cp -f "$SRC/README.txt" reports/security-agent/agent-run.txt

STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "reports/security-agent/runs/$STAMP"
cp -f reports/security-agent/evidence.md reports/security-agent/plan.json \
  reports/security-agent/correlation.json reports/security-agent/remediations.json \
  reports/security-agent/audit.jsonl reports/security-agent/security-summary.json \
  "reports/security-agent/runs/$STAMP/" 2>/dev/null || true
ln -sfn "$STAMP" reports/security-agent/runs/latest || true

bash scripts/sync-docs-outputs.sh all

cat > reports/security-agent/pr-body.md <<'EOF'
## Agent PR — heuristic remediation (CI)

This pull request was **opened automatically by GitHub Actions** (**Agent PR** workflow) after running:

```bash
make agent-heuristic   # --llm none --apply
```

### Layout

| Bucket | Path | Role |
|--------|------|------|
| **World** | `artifacts/world/` | Vulnerability analysis (Security CI scanners) |
| **Agent** | `artifacts/agent/` | Evidence, plan, patches, audit |
| **Docs** | `docs/outputs/` | Same files on the docs site under [/outputs/](https://soumyadip007.github.io/AI-Driven-DevSecOps/outputs/) |

### How this was created

1. CI loaded `artifacts/world/security-summary.json` (Security CI or fixtures).
2. The bounded security agent ran in **heuristic mode** (no LLM / no Ollama).
3. It applied remediations for SAST (SQL), SCA (`lodash`), and Dockerfile policy.
4. Evidence was written under `artifacts/agent/` and mirrored to `docs/outputs/agent/`.

### Important (demo / HIL)

- **Scanners are the source of truth** (Semgrep / Trivy / Conftest) — **World**.
- The agent **does not merge** — humans review and approve.
- Local talks can run `make agent` with **Ollama** for an LLM briefing; this CI path stays deterministic.

### Review checklist

- [ ] Browse [docs outputs](https://soumyadip007.github.io/AI-Driven-DevSecOps/outputs/)
- [ ] Read `reports/security-agent/evidence.md` / `docs/outputs/agent/evidence.md`
- [ ] Diff SQL fix, dependency bump, Dockerfile harden
- [ ] Approve merge only if residual risk is accepted

EOF

{
  echo ""
  echo "### Evidence excerpt"
  echo ""
  echo '```'
  head -n 80 reports/security-agent/evidence.md
  echo '```'
} >> reports/security-agent/pr-body.md

echo "Done. World + agent ready; docs/outputs synced; PR body written."
