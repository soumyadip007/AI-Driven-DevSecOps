#!/usr/bin/env bash
# Copy latest world/agent artifacts into docs/outputs/ for the MkDocs site.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOCS_OUT="$ROOT/docs/outputs"
WORLD_SRC="$ROOT/artifacts/world"
AGENT_SRC="$ROOT/artifacts/agent"
FIX="$ROOT/fixtures/findings"

SCOPE="${1:-all}" # world | agent | all

mkdir -p "$DOCS_OUT/world" "$DOCS_OUT/agent"

sync_world() {
  mkdir -p "$DOCS_OUT/world"
  if [[ ! -s "$WORLD_SRC/security-summary.json" ]]; then
    echo "world: seeding from fixtures"
    mkdir -p "$WORLD_SRC"
    cp "$FIX"/* "$WORLD_SRC/" 2>/dev/null || true
    ARTIFACTS_DIR="$WORLD_SRC" node "$ROOT/scripts/aggregate-security-summary.js"
  fi
  for f in security-summary.json semgrep.json trivy.json conftest.json conftest.txt; do
    [[ -f "$WORLD_SRC/$f" ]] && cp -f "$WORLD_SRC/$f" "$DOCS_OUT/world/$f"
  done
  # Prefer a small excerpt of trivy for docs size if huge — keep full for demo accuracy
  echo "world: synced → docs/outputs/world/"
}

sync_agent() {
  mkdir -p "$DOCS_OUT/agent"
  if [[ ! -d "$AGENT_SRC" ]] || [[ -z "$(ls -A "$AGENT_SRC" 2>/dev/null | grep -v runs || true)" ]]; then
    echo "agent: no artifacts/agent yet — leave docs/outputs/agent placeholders"
    return 0
  fi
  SRC="$AGENT_SRC"
  if [[ -L "$AGENT_SRC/runs/latest" || -d "$AGENT_SRC/runs/latest" ]]; then
    SRC="$AGENT_SRC/runs/latest"
  fi
  for f in evidence.md llm-briefing.md audit.jsonl plan.json correlation.json remediations.json \
           products.remediated.js package.json.remediated Dockerfile.remediated README.txt; do
    [[ -f "$SRC/$f" ]] && cp -f "$SRC/$f" "$DOCS_OUT/agent/$f"
    [[ -f "$AGENT_SRC/$f" && ! -f "$DOCS_OUT/agent/$f" ]] && cp -f "$AGENT_SRC/$f" "$DOCS_OUT/agent/$f"
  done
  echo "agent: synced → docs/outputs/agent/ (from $SRC)"
}

write_index() {
  local index="$DOCS_OUT/index.md"
  cat > "$index" <<'EOF'
# Demo outputs

Browsable copies of the latest **world** (Security CI / scanners) and **agent** (Security Agent) artifacts.

Published on GitHub Pages so you can open evidence from the docs site during the talk.

| Bucket | Meaning | Local path | CI workflow |
|--------|---------|------------|-------------|
| **World** | Vulnerability analysis — Semgrep, Trivy, Conftest, summary | `artifacts/world/` | **Security CI** |
| **Agent** | Bounded agent — briefing, evidence, patches, audit | `artifacts/agent/` | **Agent PR** + local `make agent` |

## World (scanners)

EOF

  if ls "$DOCS_OUT/world"/* >/dev/null 2>&1; then
    echo "" >> "$index"
    echo "| File | Link |" >> "$index"
    echo "|------|------|" >> "$index"
    for f in "$DOCS_OUT/world"/*; do
      [[ -f "$f" ]] || continue
      base="$(basename "$f")"
      echo "| \`$base\` | [open](world/$base) |" >> "$index"
    done
  else
    echo "_No world files synced yet. Run \`make scan\`._" >> "$index"
  fi

  cat >> "$index" <<'EOF'

## Agent (security agent)

EOF

  if ls "$DOCS_OUT/agent"/* >/dev/null 2>&1; then
    echo "" >> "$index"
    echo "| File | Link |" >> "$index"
    echo "|------|------|" >> "$index"
    for f in "$DOCS_OUT/agent"/*; do
      [[ -f "$f" ]] || continue
      base="$(basename "$f")"
      [[ "$base" == "index.md" ]] && continue
      echo "| \`$base\` | [open](agent/$base) |" >> "$index"
    done
  else
    echo "_No agent files synced yet. Run \`make agent\` or \`make agent-heuristic\`._" >> "$index"
  fi

  cat >> "$index" <<'EOF'

## Timestamped local archives

Not all historical runs are published (keeps the site small). On your laptop:

```text
artifacts/world/runs/<timestamp>/
artifacts/agent/runs/<timestamp>/
```

## CI artifact downloads

After a workflow run on GitHub Actions, also download:

- **Security CI** → `world-*` artifacts  
- **Agent PR** → `agent-reports` artifact  

See [CI explained](../ci.md).
EOF

  echo "index: wrote $index"
}

case "$SCOPE" in
  world) sync_world ;;
  agent) sync_agent ;;
  all)
    sync_world
    sync_agent
    ;;
  *)
    echo "Usage: $0 [world|agent|all]"
    exit 1
    ;;
esac

write_index
echo "Docs outputs ready under docs/outputs/"
