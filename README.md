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

**Full explanation** (what each project does, similarities, differences, and how they connect):

→ [`docs/projects.md`](docs/projects.md)

Also: [`docs/tooling.md`](docs/tooling.md) · [`docs/demo-script.md`](docs/demo-script.md) · [`docs/architecture.md`](docs/architecture.md)

## Quick start

```bash
make install
make test
```

### Full local demo loop

Requires optional CLIs: [Semgrep](https://semgrep.dev/), [Trivy](https://trivy.dev/), [Conftest](https://www.conftest.dev/). If missing, the scan script falls back to `fixtures/findings/`.

```bash
make scan          # tests + scanners → artifacts/security-summary.json
make agent         # propose remediation + evidence (does not merge)
# optional:
make agent-apply   # write parameterized SQL fix into vuln-shop
make demo-reset    # restore vulnerable files from git
```

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

GitHub Actions workflow: `.github/workflows/security.yml`

- unit tests  
- Semgrep / Trivy / Conftest  
- aggregate → `security-summary` artifact  

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
