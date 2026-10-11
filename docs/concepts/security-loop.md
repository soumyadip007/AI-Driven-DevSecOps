# The AI-driven security loop

A continuous feedback system that can run at PR time, in CI, at deploy, or during incident investigation.

```text
Perceive → Decide → Act → Reflect → Remember
```

| Stage | Meaning | In this repo |
|-------|---------|--------------|
| **Perceive** | Collect code, findings, policies, dependencies, runtime signals | Semgrep / Trivy / Conftest → `security-summary.json` |
| **Decide** | Prioritize the next security action using evidence + policy | Agent Reason/Plan — pick hero finding |
| **Act** | Generate a fix, investigation, or remediation workflow | Agent patches (SQL, lodash, Dockerfile) |
| **Reflect** | Validate the outcome and capture what changed | Unit tests + re-scan |
| **Remember** | Preserve evidence for future decisions | `evidence.md`, `audit.jsonl`, PR body |

## Agentic view (same idea)

```text
Observe → Reason → Plan → Act → Validate → Escalate
```

See [Projects](../projects.md) for how `vuln-shop` and `security-agent` split these roles.
