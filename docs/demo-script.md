# Stage demo script (~10 minutes)

## Prep (before talk)

```bash
make install
make scan
make agent
# Keep three windows ready:
# 1) editor / PR view of apps/vuln-shop/src/routes/products.js
# 2) artifacts/security-summary.json or CI checks
# 3) agents/security-agent/out/evidence.md + audit.jsonl
```

Backup: record `make scan && make agent` once if conference Wi‑Fi is unreliable.

## Live flow

| Time | Say / do |
|------|----------|
| 0:00 | Open vulnerable PR (or local file). Point at string-concat SQL, `lodash@4.17.19`, Dockerfile without `USER`. |
| 1:30 | Show CI red (or `artifacts/`): Semgrep SQLi, Trivy CVE, Conftest deny. |
| 3:00 | Run `make agent`. Walk Observe → Reason → Plan in `audit.jsonl`. |
| 4:30 | Show denied `merge_pr` line — permissions / tool boundaries. |
| 5:30 | Open `evidence.md` + three patches: SQL, `lodash` bump, Dockerfile. Emphasize finding IDs. |
| 7:00 | Optional: `make agent-apply && make test` then mention re-scan. |
| 8:30 | Close: AI explains/remediates; controls evidence; human merges. |

See also: [`projects.md`](./projects.md) for how the two projects connect.

## Reset between rehearsals

```bash
make demo-reset
rm -rf agents/security-agent/out
make scan && make agent
```
