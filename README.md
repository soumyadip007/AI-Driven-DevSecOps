# AI-Driven DevSecOps (CRACCON’26)

Demo monorepo for the talk **AI-Driven DevSecOps** — security as a continuous feedback loop.

AI orchestrates and explains; deterministic scanners provide evidence; humans approve merges.

## Projects

| Path | Role |
|------|------|
| `apps/vuln-shop` | Tiny Express shop API with **intentional** SAST/SCA/policy issues |
| `agents/security-agent` | Bounded agent: Observe → Reason → Plan → Act → Validate → Escalate |
| `policies/` | Semgrep, Conftest, Gitleaks config |
| `scripts/` | Local scan harness + `security-summary.json` aggregator |

**Docs site (MkDocs):** after GitHub Pages is enabled →  
`https://soumyadip007.github.io/AI-Driven-DevSecOps/`

| Doc | Topic |
|-----|--------|
| [`docs/demo-walkthrough.md`](docs/demo-walkthrough.md) | **Step-by-step stage demo** (show this) |
| [`docs/concepts/glossary.md`](docs/concepts/glossary.md) | What **SAST**, **SCA**, **Semgrep**, **Trivy**, **Conftest**, **SBOM** mean |
| [`docs/concepts/llm.md`](docs/concepts/llm.md) | Ollama integration |
| [`docs/projects.md`](docs/projects.md) | Both projects + how they connect |
| [`docs/ci.md`](docs/ci.md) | Security CI + agent-heuristic PR workflow |
| [`docs/tooling.md`](docs/tooling.md) | Local scanners |

```bash
make docs-install && make docs-serve   # local docs at http://127.0.0.1:8000
```

## Quick start

```bash
make install
make test
```

### Full local demo loop

Requires optional CLIs: [Semgrep](https://semgrep.dev/), [Trivy](https://trivy.dev/), [Conftest](https://www.conftest.dev/). If missing, the scan script falls back to `fixtures/findings/`.

```bash
make scan             # → artifacts/world/  (Security CI / scanners)
make agent            # → artifacts/agent/  (Ollama briefing + patches)
make agent-heuristic  # same agent path without LLM
make sync-outputs     # mirror into docs/outputs/ for the site
# optional:
make agent-apply && make demo-reset
```

**Docs catalog (after Pages deploy):**  
https://soumyadip007.github.io/AI-Driven-DevSecOps/outputs/

Requires [Ollama](https://ollama.com/) for `make agent`. See [docs/concepts/llm.md](docs/concepts/llm.md).

### What the audience should see

1. **PR / code** — vulnerable search SQL, pinned old `lodash`, insecure Dockerfile  
2. **Evidence** — Semgrep + Trivy + Conftest → `artifacts/security-summary.json` + agent `evidence.md`  
3. **Remediation** — proposed patch + unit tests; human still approves merge  

The agent **denies** `merge_pr` / production deploy tools on purpose (see audit log).

## Seeded findings (demo)

| Control | Issue |
|---------|--------|
| SAST (Semgrep) | SQL string concatenation in `GET /api/products/search` |
| SCA (Trivy) | `lodash@4.17.19` (known HIGH/CRITICAL advisories) |
| Policy (Conftest) | Dockerfile runs as root, no `HEALTHCHECK` |

Fake secret examples live only in commented `.demo-secret.example` — do not add real credentials.

## CI

GitHub Actions workflows:

- `.github/workflows/security.yml` — unit tests, SAST (Semgrep), SCA (Trivy), policy (Conftest), aggregate summary  
- `.github/workflows/docs.yml` — build & deploy MkDocs to GitHub Pages  

`vuln-shop` is intentionally insecure: findings show up in the `security-summary` artifact (see [docs/ci.md](docs/ci.md)).  

**One-time GitHub setup**

1. **Pages:** Settings → Pages → Source: **GitHub Actions**  
2. **Agent PR:** Settings → Actions → General → Workflow permissions → enable **Allow GitHub Actions to create and approve pull requests** (or add secret `AGENT_PR_TOKEN`)

## Layout

```text
apps/vuln-shop/           # Project A
agents/security-agent/    # Project B
policies/                 # deterministic controls
fixtures/                 # golden fix + offline scanner fixtures
docs/demo-script.md       # stage timing
plan.md                   # full delivery plan
```

## Safety

This repository contains **intentionally insecure patterns** for education. Do not deploy `vuln-shop` as a real service.
