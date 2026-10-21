# Outputs layout (world + agent)

## Goal

Separate **vulnerability analysis** evidence from **agent remediation** evidence, rename CI clearly, and make both browsable from the docs site.

## Naming

| Name | Meaning |
|------|---------|
| **Security CI** | Scanner pipeline (Semgrep / Trivy / Conftest) — finding the issues |
| **Agent PR** | Heuristic agent remediations + PR (was `security-agent-pr`) |
| **`artifacts/world/`** | Scanner / “security world” findings + summaries |
| **`artifacts/agent/`** | Agent evidence, briefings, patches, audit trail |

> “World” = the observed security world (findings from controls).  
> “Agent” = what the bounded agent decides and proposes.

## Directory layout

```text
artifacts/
  world/                          # Security CI / make scan
    security-summary.json         # latest (agent reads this)
    semgrep.json
    trivy.json
    conftest.json
    conftest.txt
    runs/<YYYYMMDD-HHMMSS>/       # timestamped archives
    runs/latest -> …

  agent/                          # make agent / Agent PR CI
    evidence.md                   # latest
    llm-briefing.md
    audit.jsonl
    plan.json
    correlation.json
    remediations.json
    *.remediated*
    runs/<YYYYMMDD-HHMMSS>/
    runs/latest -> …

docs/outputs/                     # published on GitHub Pages
  index.md                        # catalog + links
  world/                          # synced snapshots for the site
  agent/                          # synced snapshots for the site
```

Legacy paths (`artifacts/*.json`, `agents/security-agent/out/`) become thin redirects/copies into `world/` and `agent/`.

## CI artifacts

| Workflow | Display name | Uploaded artifact names |
|----------|--------------|-------------------------|
| `security.yml` | **Security CI** | `world-security-summary`, `world-semgrep`, `world-trivy`, `world-conftest` |
| `security-agent-pr.yml` | **Agent PR** | `agent-reports` (from `artifacts/agent` + `reports/security-agent`) |
| `docs.yml` | **docs** | Site includes `docs/outputs/**` |

## Docs site access

After deploy:  
`https://soumyadip007.github.io/AI-Driven-DevSecOps/outputs/`

Lists every generated file under **World** and **Agent** with in-site links (and pointers to Actions artifact downloads).

## Implementation checklist

1. Restructure local scan + agent scripts to write under `artifacts/world` and `artifacts/agent`
2. Rename Agent PR workflow file/display name; retitle Security CI
3. Update Makefile, CI, aggregator paths
4. Sync snapshots into `docs/outputs/{world,agent}` for Pages
5. Add Outputs nav page; test `make scan` + `make agent` + docs build
6. Commit & push
