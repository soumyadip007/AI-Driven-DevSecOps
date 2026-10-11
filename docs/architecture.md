# Demo architecture

```text
Developer                CI                         AI security layer
   |                     |                                 |
   |-- open PR --------->|                                 |
   |                     |-- tests -----------------------|
   |                     |-- Semgrep (SAST) --------------|
   |                     |-- Trivy (SCA) -----------------|
   |                     |-- Conftest (policy) -----------|
   |                     |-- aggregate summary ---------->|
   |                     |                                 |-- Observe
   |                     |                                 |-- Reason / Plan
   |                     |                                 |-- Act (patch)
   |                     |                                 |-- Validate
   |                     |                                 |-- Escalate
   |<------------- evidence PR / comment ------------------|
   |-- human approve ---> merge (agent cannot merge)
```

## Evidence contract

`artifacts/security-summary.json` is the hand-off between controls and the agent:

- `counts` — totals by category  
- `findings[]` — normalized records with `finding_id`, `tool`, `severity`, `filepath`, `category`  

Agent outputs (never auto-merged):

- `out/plan.json`  
- `out/products.remediated.js`  
- `out/evidence.md`  
- `out/audit.jsonl`  
- `out/correlation.json`  
