# CI explained

Workflow: [`.github/workflows/security.yml`](https://github.com/soumyadip007/AI-Driven-DevSecOps/blob/main/.github/workflows/security.yml)

## Jobs

| Job | Type | What it does |
|-----|------|--------------|
| `unit-tests` | Functional | Runs `vuln-shop` tests (can be green while security is not) |
| `sast-semgrep` | **SAST** | Semgrep custom rules on `apps/vuln-shop` |
| `sca-trivy` | **SCA** | Trivy filesystem scan for vulnerable deps |
| `policy-conftest` | **Policy** | Conftest/OPA rules on the Dockerfile |
| `aggregate-security-summary` | Evidence | Builds `security-summary.json` for the agent |
| `demo-findings-report` | Demo signal | Warns when intentional findings remain |

## Why an earlier run looked “broken”

On [run #1](https://github.com/soumyadip007/AI-Driven-DevSecOps/actions/runs/38136665488):

1. **Trivy action tag was invalid** (`aquasecurity/trivy-action@0.28.0` could not be resolved) — tooling bug, now pinned to `0.35.0`.
2. **Semgrep / Conftest exited non-zero** because they correctly found seeded issues. That looked like a pipeline failure even when the tools worked.

Current design:

- Scanner jobs **collect** findings and stay green when the tool itself succeeds.
- Findings are visible in the **`security-summary` artifact** and a warning on `demo-findings-report`.
- That matches the talk: controls provide evidence; the agent (and humans) act on it.

## Artifacts to download after a run

- `semgrep-json`
- `trivy-json`
- `conftest-json`
- `security-summary` ← feed this to `make agent`

## Remediation PR workflow (`security-agent-pr`)

Workflow: [`.github/workflows/security-agent-pr.yml`](https://github.com/soumyadip007/AI-Driven-DevSecOps/blob/main/.github/workflows/security-agent-pr.yml)

| Trigger | Behavior |
|---------|----------|
| After **security** workflow finishes on `main` | Runs heuristic agent and opens/updates a PR |
| Manual **Run workflow** | Same |

What it runs (no Ollama in CI):

```bash
# scripts/ci-agent-heuristic.sh ≈
make agent-heuristic   # --llm none
# then --apply remediations + reports/security-agent/*
```

PR title: `fix(security): agent-heuristic remediations for vuln-shop`  
Branch: `agent/heuristic-remediation`  

The PR body states it was **created by CI** via the heuristic agent. Humans still approve the merge.

### Required: allow Actions to open PRs

If the job fails with:

> `GitHub Actions is not permitted to create or approve pull requests`

do **one** of the following:

#### Option A (recommended for the demo)

1. Open [Settings → Actions → General](https://github.com/soumyadip007/AI-Driven-DevSecOps/settings/actions)
2. Under **Workflow permissions**:
   - Select **Read and write permissions**
   - Check **Allow GitHub Actions to create and approve pull requests**
3. Save, then re-run **security-agent-pr**

#### Option B (PAT)

1. Create a classic Personal Access Token with `repo` scope  
2. Add it as repository secret `AGENT_PR_TOKEN`  
3. Re-run the workflow (it prefers this secret over `GITHUB_TOKEN`)

> Note: the branch push can succeed even when PR creation is blocked. After enabling the setting, re-run — the PR will be created against `agent/heuristic-remediation`.

For the live LLM briefing on stage, use local `make agent` (Ollama). See [demo walkthrough](demo-walkthrough.md).
