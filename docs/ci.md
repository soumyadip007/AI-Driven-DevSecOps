# CI explained

Two workflows, two artifact buckets.

| Workflow file | Display name | Writes | Purpose |
|---------------|--------------|--------|---------|
| `.github/workflows/security.yml` | **Security CI** | `artifacts/world/` | Vulnerability analysis (SAST/SCA/policy) |
| `.github/workflows/agent-pr.yml` | **Agent PR** | `artifacts/agent/` + remediation PR | Heuristic agent remediations |
| `.github/workflows/docs.yml` | **docs** | GitHub Pages | Docs site including [/outputs/](https://soumyadip007.github.io/AI-Driven-DevSecOps/outputs/) |

## World vs Agent

```text
artifacts/world/   ← Security CI / make scan   (findings)
artifacts/agent/   ← Agent PR / make agent     (evidence + patches)
docs/outputs/      ← mirrored for the docs site (clickable links)
```

## Security CI jobs

| Job | Type | Artifact |
|-----|------|----------|
| `unit-tests` | Functional | — |
| `sast-semgrep` | SAST | `world-semgrep` |
| `sca-trivy` | SCA | `world-trivy` |
| `policy-conftest` | Policy | `world-conftest` |
| `aggregate-world-summary` | Evidence | `world-bundle` (full `artifacts/world` + docs mirror) |
| `demo-findings-report` | Demo signal | Warns when intentional findings remain |

## Agent PR workflow

| Trigger | Behavior |
|---------|----------|
| After **Security CI** finishes on `main` | Runs heuristic agent and opens/updates a PR |
| Manual **Run workflow** | Same (button on the **Agent PR** workflow page) |

### How to get the “Run workflow” button

1. Open: https://github.com/soumyadip007/AI-Driven-DevSecOps/actions/workflows/agent-pr.yml  
2. Select workflow name **Agent PR** (not an old disabled `security-agent-pr` entry).  
3. Branch dropdown: **`main`**.  
4. Click **Run workflow**.

If the button is missing:

- You must be on the workflow file that exists on **`main`** (this repo uses `.github/workflows/agent-pr.yml`).  
- Refresh after the latest push lands on `main`.  
- Under Actions → manage workflows, ensure **Agent PR** is **enabled** (not disabled after the rename).  
- Direct link above is the reliable entry point.

```bash
# scripts/ci-agent-heuristic.sh ≈
make agent-heuristic   # --llm none --apply
```

PR title: `fix(agent): heuristic remediations for vuln-shop`  
Branch: `agent/heuristic-remediation`  
Uploaded artifact: **`agent-reports`**

### Required: allow Actions to open PRs

If PR create fails with *not permitted to create or approve pull requests*:

1. [Settings → Actions → General](https://github.com/soumyadip007/AI-Driven-DevSecOps/settings/actions)  
2. **Read and write permissions** + ☑ **Allow GitHub Actions to create and approve pull requests**  
3. Or secret `AGENT_PR_TOKEN` (classic PAT, `repo` scope)

## Docs site outputs

After deploy, open:

**https://soumyadip007.github.io/AI-Driven-DevSecOps/outputs/**

You get tables linking every world/agent file (summary, evidence, patches, audit, …).

Local: `make sync-outputs` then `make docs-serve`.
