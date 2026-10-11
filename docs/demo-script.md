# Stage demo script (~10 minutes)

Full checklist: **[demo-walkthrough.md](demo-walkthrough.md)**.

## Prep

```bash
make install && make demo-reset && make scan && make agent
```

Windows: vulnerable code · Actions/CI · `out/llm-briefing.md` + `audit.jsonl`.

## Live flow

| Time | Do |
|------|-----|
| 0:00 | Vulnerable SQL + lodash + Dockerfile on `main` |
| 1:30 | `make scan` or security Actions → `security-summary.json` |
| 3:00 | `make agent` (Ollama) → `llm-briefing.md` + denied `merge_pr` in audit |
| 5:30 | Evidence + three remediation files |
| 7:00 | Actions → **security-agent-pr** → open the auto PR (heuristic CI) |
| 9:00 | Close: scanners evidence · LLM explains · human merges |

## Reset

```bash
make demo-reset && rm -rf agents/security-agent/out
```
