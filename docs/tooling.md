# Local security tooling

These CLIs power `make scan`. CI uses the same classes of tools in GitHub Actions.

New to the acronyms? See the [glossary](concepts/glossary.md) (SAST, SCA, Semgrep, Trivy, Conftest, SBOM, …).

## Install (macOS)

```bash
brew install semgrep trivy conftest
semgrep --version
trivy --version
conftest --version
```

## What each tool does here

| Tool | Job | Input | Output artifact |
|------|-----|-------|-----------------|
| **Semgrep** | SAST — find insecure code patterns | `apps/vuln-shop` + `policies/semgrep` | `artifacts/semgrep.json` |
| **Trivy** | SCA — find vulnerable dependencies | `apps/vuln-shop` | `artifacts/trivy.json` |
| **Conftest** | Policy-as-code — Dockerfile rules | `apps/vuln-shop/Dockerfile` + `policies/conftest` | `artifacts/conftest.json` |
| **Aggregator** | Normalize findings for the agent | above JSON files | `artifacts/security-summary.json` |

## Run

```bash
make scan
# equivalent:
bash scripts/run-local-scans.sh
```

If a CLI is missing, or Trivy’s vulnerability DB download times out, the script falls back to `fixtures/findings/` so the agent demo still works offline / on flaky Wi‑Fi.

**Note:** The first Trivy run downloads a large DB. If that hangs, kill it and re-run `make scan` — fixtures cover SCA until the DB is cached.

## After a successful scan

```bash
make agent          # propose remediations
make agent-apply    # write remediations into vuln-shop (optional)
make demo-reset     # restore vulnerable files from git
```
