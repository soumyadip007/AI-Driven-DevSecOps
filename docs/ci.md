# CI explained

Two workflows, two **GitHub Actions Artifacts**.

| Workflow file | Display name | Artifact | Purpose |
|---------------|--------------|----------|---------|
| `.github/workflows/security.yml` | **Security CI** | **`world`** | Vulnerability analysis (SAST/SCA/policy) |
| `.github/workflows/security-agent-pr.yml` | **Agent PR** | **`agent`**, **`agent-reports`** | Heuristic remediations + PR |
| `.github/workflows/docs.yml` | **docs** | Pages site | Docs (including [Outputs guide](outputs/index.md)) |

Generated `docs/outputs/world/` and `docs/outputs/agent/` are **gitignored**.  
Download run outputs from the Actions run page → **Artifacts**.

## World vs Agent

```text
artifacts/world/   ← Security CI / make scan   → Artifact "world"
artifacts/agent/   ← Agent PR / make agent     → Artifact "agent"
```

## How to download artifacts

1. Open the workflow run (e.g. [Agent PR](https://github.com/soumyadip007/AI-Driven-DevSecOps/actions/workflows/security-agent-pr.yml))
2. Open a completed run
3. Scroll to **Artifacts**
4. Download `world` / `agent` / `agent-reports`

## Agent PR — Run workflow

https://github.com/soumyadip007/AI-Driven-DevSecOps/actions/workflows/security-agent-pr.yml

1. Branch **`main`**
2. **Run workflow**

### Allow Actions to open PRs

If PR create fails with *not permitted*:

1. [Settings → Actions → General](https://github.com/soumyadip007/AI-Driven-DevSecOps/settings/actions)
2. **Read and write** + ☑ **Allow GitHub Actions to create and approve pull requests**
3. Or secret `AGENT_PR_TOKEN` (classic PAT, `repo` scope)

Artifacts still upload even if PR creation is blocked.
