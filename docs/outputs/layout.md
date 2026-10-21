# Outputs layout (world + agent)

## Goal

Separate **vulnerability analysis** evidence from **agent remediation** evidence.  
Persist them as **GitHub Actions Artifacts** (not git commits on `main`).

## Naming

| Name | Meaning |
|------|---------|
| **Security CI** | Scanner pipeline — finding the issues |
| **Agent PR** | Heuristic agent remediations + PR |
| **`artifacts/world/`** | Scanner findings + summaries |
| **`artifacts/agent/`** | Agent evidence, briefings, patches, audit |

## Local directories

```text
artifacts/
  world/                    # make scan / Security CI
    security-summary.json
    semgrep.json, trivy.json, conftest.*
    runs/<timestamp>/
  agent/                    # make agent / Agent PR
    evidence.md, audit.jsonl, *.remediated*
    runs/<timestamp>/
```

`docs/outputs/world/` and `docs/outputs/agent/` are **gitignored** local mirrors only.

## CI Artifacts

| Workflow | Artifact | Path uploaded |
|----------|----------|---------------|
| `security.yml` (**Security CI**) | `world` | `artifacts/world/` |
| `security-agent-pr.yml` (**Agent PR**) | `agent` | `artifacts/agent/` |
| `security-agent-pr.yml` (**Agent PR**) | `agent-reports` | `reports/security-agent/` |

Download from the run’s **Artifacts** section after the job finishes.
