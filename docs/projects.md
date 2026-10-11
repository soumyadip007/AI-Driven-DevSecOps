# The two demo projects — what they are and how they connect

This repository ships **two projects** that tell one CRACCON’26 story:

> AI orchestrates and explains; deterministic security controls provide evidence; humans approve merges.

| Project | Path | One-line role |
|---------|------|----------------|
| **A — vuln-shop** | `apps/vuln-shop` | A small app that is *intentionally insecure* so real scanners have something to catch |
| **B — security-agent** | `agents/security-agent` | A *bounded* agent that reads scanner evidence and proposes remediations without merging |

They are not alternatives. **A produces the problem and the evidence; B consumes the evidence and proposes the fix.**

---

## 1. Project A — `vuln-shop`

### What it does

`vuln-shop` is a tiny Express + SQLite “shop” API used as the **vulnerable application under test**.

It exposes:

- `GET /health`
- `GET /api/products`
- `GET /api/products/search?q=...`
- `GET /api/products/:id`

### Why it exists

Talk demos fail when findings are fake. This app seeds **real, scanner-visible** issues:

| Seeded issue | Where | Control that catches it |
|--------------|-------|-------------------------|
| SQL injection via string concat | `src/routes/products.js` search handler | Semgrep (SAST) |
| Outdated vulnerable dependency | `lodash@4.17.19` in `package.json` | Trivy (SCA) |
| Insecure container defaults | `Dockerfile` (root user, no HEALTHCHECK) | Conftest (policy-as-code) |

Unit tests still pass on the vulnerable code (happy-path search). That is deliberate: **functional green ≠ security green**.

### What it is *not*

- Not a production service  
- Not a full microservice platform  
- Not an exploit lab (we show insecure patterns; we do not weaponize them on stage)

### How you run it

```bash
cd apps/vuln-shop
npm install
npm test
npm start   # http://localhost:3000
```

---

## 2. Project B — `security-agent`

### What it does

`security-agent` is a **bounded agentic workflow** that implements the talk loop:

```text
Observe → Reason → Plan → Act → Validate → Escalate
```

| Phase | Behavior |
|-------|----------|
| **Observe** | Read `artifacts/security-summary.json` (and related code/manifests via allowlisted tools) |
| **Reason** | Correlate findings; pick a highest-impact “hero” issue; state a root-cause hypothesis |
| **Plan** | Choose remediation steps (SQL fix, dependency bump, Dockerfile harden) |
| **Act** | Generate patch files with **approved tools only** |
| **Validate** | Run `vuln-shop` unit tests |
| **Escalate** | Write `evidence.md` + `audit.jsonl`; **never merge** |

### Hard boundaries (demo requirements)

- Explicit permissions (`READ_FINDINGS`, `WRITE_BRANCH`, …)  
- Tool allowlist — `merge_pr` and `production_deploy` are permanently denied  
- Audit log of every phase/tool call  
- Failure / ambiguity → escalate to a human  

### Remediations it can propose

| Finding class | Output artifact | Target file |
|---------------|-----------------|-------------|
| SAST / SQLi | `products.remediated.js` | `apps/vuln-shop/src/routes/products.js` |
| SCA / lodash | `package.json.remediated` | `apps/vuln-shop/package.json` |
| Policy / Dockerfile | `Dockerfile.remediated` | `apps/vuln-shop/Dockerfile` |

By default patches are **proposed only** (`agents/security-agent/out/`).  
Pass `--apply` to write them into the workspace (still no merge).

### How you run it

```bash
# after scanners (or fixtures) produced a summary:
node agents/security-agent/src/cli.js --summary artifacts/security-summary.json
# or
make agent
```

---

## 3. Similarities

Both projects serve the same talk thesis and share design rules:

| Similarity | Meaning |
|------------|---------|
| **Evidence over vibes** | Claims point at files, finding IDs, or scanner output |
| **PR-time security** | The loop is meant to run when a change is proposed, not months later |
| **Human-in-the-loop** | Neither project auto-merges to `main` |
| **Deterministic controls first** | Semgrep / Trivy / Conftest are source of truth; the agent does not invent CVEs |
| **Demo-safe** | Fake/intentional issues only; no real secrets |
| **Small surface** | Tiny API + linear agent state machine → reliable on stage |

---

## 4. Differences

| Dimension | vuln-shop (A) | security-agent (B) |
|-----------|---------------|--------------------|
| Primary role | **Subject under test** | **Intelligence / remediation layer** |
| Produces | Code, Dockerfile, lockfile, runtime API | Plan, patches, evidence, audit trail |
| Consumes | Developer changes | Scanner artifacts + app files |
| Failure mode shown | CI goes red | Agent proposes fix + escalates |
| Talk slide | “Vulnerable App → Secure PR” | “Security Agent Architecture” |
| Can it merge? | N/A (it’s the app) | **No** |

---

## 5. How they connect (the security loop)

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Developer change                         │
│                     (PR into vuln-shop)                         │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Deterministic controls (policies/ + CI / make scan)            │
│  Semgrep · Trivy · Conftest · tests                             │
│  → artifacts/security-summary.json                              │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  security-agent (Perceive/Decide/Act/Reflect/Remember)          │
│  Correlate → remediate SQL + lodash + Dockerfile → test →       │
│  evidence.md + audit.jsonl                                      │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Human reviews evidence + diff, re-checks CI, approves merge    │
└─────────────────────────────────────────────────────────────────┘
```

Mapped to the talk’s **AI-Driven Security Loop**:

| Loop stage | Who | What |
|------------|-----|------|
| **Perceive** | CI + scanners on `vuln-shop` | Collect code, findings, policies, dependencies |
| **Decide** | `security-agent` Reason/Plan | Prioritize hero finding + remediation steps |
| **Act** | `security-agent` Act | Generate focused patches |
| **Reflect** | tests + re-scan | Validate behavior and security signal |
| **Remember** | `evidence.md` / `audit.jsonl` / PR body | Preserve evidence for the next decision |

**Data contract between them:**

```text
vuln-shop  --(scanners)-->  artifacts/security-summary.json  --(input)-->  security-agent
security-agent  --(patches)-->  proposed fixes for vuln-shop files
```

Without Project A, Project B has nothing trustworthy to observe.  
Without Project B, Project A is “just another vulnerable sample app.”

---

## 6. End-to-end commands

```bash
# 1) App works
make install && make test

# 2) Real scanners (Semgrep, Trivy, Conftest) → summary
make scan

# 3) Agent proposes SQL + lodash + Dockerfile remediations
make agent

# Inspect
ls artifacts/
ls agents/security-agent/out/
cat agents/security-agent/out/evidence.md

# Optional: apply patches into the workspace (still no merge)
make agent-apply
# Then re-scan / reset:
make demo-reset
```

Offline fallback (no scanner CLIs): copy `fixtures/findings/*` into `artifacts/` and run the aggregator + agent (see `README.md`).

---

## 7. What to show on stage (three screens)

1. **PR / code** — `vuln-shop` vulnerable search + package + Dockerfile  
2. **Evidence** — CI checks or `security-summary.json` + agent `audit.jsonl`  
3. **Remediation** — `products.remediated.js`, `package.json.remediated`, `Dockerfile.remediated` + human approval  

Minute-by-minute script: [`demo-script.md`](./demo-script.md)  
Diagram notes: [`architecture.md`](./architecture.md)  
Delivery plan: [`../plan.md`](../plan.md)
