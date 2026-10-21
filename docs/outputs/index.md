# Demo outputs

Browsable copies of the latest **world** (Security CI / scanners) and **agent** (Security Agent) artifacts.

Published on GitHub Pages so you can open evidence from the docs site during the talk.

| Bucket | Meaning | Local path | CI workflow |
|--------|---------|------------|-------------|
| **World** | Vulnerability analysis — Semgrep, Trivy, Conftest, summary | `artifacts/world/` | **Security CI** |
| **Agent** | Bounded agent — briefing, evidence, patches, audit | `artifacts/agent/` | **Agent PR** + local `make agent` |

## World (scanners)


| File | Link |
|------|------|
| `conftest.json` | [open](world/conftest.json) |
| `conftest.txt` | [open](world/conftest.txt) |
| `security-summary.json` | [open](world/security-summary.json) |
| `semgrep.json` | [open](world/semgrep.json) |
| `trivy.json` | [open](world/trivy.json) |

## Agent (security agent)


| File | Link |
|------|------|
| `Dockerfile.remediated` | [open](agent/Dockerfile.remediated) |
| `README.txt` | [open](agent/README.txt) |
| `audit.jsonl` | [open](agent/audit.jsonl) |
| `correlation.json` | [open](agent/correlation.json) |
| `evidence.md` | [open](agent/evidence.md) |
| `llm-briefing.md` | [open](agent/llm-briefing.md) |
| `package.json.remediated` | [open](agent/package.json.remediated) |
| `plan.json` | [open](agent/plan.json) |
| `products.remediated.js` | [open](agent/products.remediated.js) |
| `remediations.json` | [open](agent/remediations.json) |

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
