# Step-by-step demo walkthrough (for the audience)

Use this as your CRACCON stage checklist. Total live time: **~10 minutes**.

---

## 0. Prep (day before / morning of)

```bash
cd /path/to/AI-Driven-DevSecOps
git checkout main
git pull
make install
make demo-reset          # vulnerable SQL + lodash@4.17.19 + insecure Dockerfile
ollama serve &           # if not already running
ollama list              # confirm llama3 is present
make scan                # or: fixtures fallback if Trivy is slow
make agent               # smoke-test Ollama briefing once
```

Open three surfaces:

1. **Code / GitHub** — `apps/vuln-shop` on `main` (vulnerable)
2. **CI / Actions** — security workflow + (optional) agent PR workflow  
3. **Terminal / evidence** — `agents/security-agent/out/`

Backup recording: one clean run of `make scan && make agent` in case Wi‑Fi dies.

**GitHub Pages (docs):** Settings → Pages → Source = GitHub Actions  
Site: `https://soumyadip007.github.io/AI-Driven-DevSecOps/`

---

## 1. Story setup (30–60s)

Say:

> We have a small shop API. A change introduces insecure SQL, an outdated dependency, and a bad Dockerfile. Security controls will find that. An agent will explain and propose a fix. A human still merges.

Show files briefly:

- `apps/vuln-shop/src/routes/products.js` — string-concat SQL  
- `apps/vuln-shop/package.json` — `lodash@4.17.19`  
- `apps/vuln-shop/Dockerfile` — no non-root `USER`, no `HEALTHCHECK`

---

## 2. Perceive — scanners / CI (2 min)

**Option A (local — most reliable on stage):**

```bash
make scan
```

Open `artifacts/security-summary.json` — point at SAST / SCA / policy counts.

**Option B (GitHub Actions):**

Open the latest **security** workflow run. Jobs:

| Job | Meaning |
|-----|---------|
| `sast-semgrep` | Static analysis (code patterns) |
| `sca-trivy` | Dependency CVEs |
| `policy-conftest` | Dockerfile policy-as-code |
| `aggregate-security-summary` | Evidence pack for the agent |

Say: *Deterministic controls provide evidence — not the LLM.*

---

## 3. Local intelligence — Ollama agent (3 min)

```bash
make agent
```

Show live:

1. Terminal: `LLM: ollama / llama3` then finished summary  
2. `agents/security-agent/out/llm-briefing.md` — audience narrative citing finding IDs  
3. `agents/security-agent/out/audit.jsonl` — scroll to:
   - `llm_chat` status ok  
   - `merge_pr` **denied** (tool boundary beat)  
4. `agents/security-agent/out/evidence.md` — briefing + plan + three remediations  
5. Patches listed:
   - `products.remediated.js`
   - `package.json.remediated`
   - `Dockerfile.remediated`

Talking point:

> The model explains. Templates apply known-safe remediations. Merge stays with humans.

---

## 4. CI path — heuristic agent opens a PR (2 min)

This is the **reliable / no-Ollama** automation path.

1. GitHub → **Actions** → **security-agent-pr**  
2. Run workflow (**Run workflow** on `main`) — or wait after a `security` workflow finishes  
3. When it completes, open the PR:  
   **`fix(security): agent-heuristic remediations for vuln-shop`**  
   Branch: `agent/heuristic-remediation`

In the PR body, call out:

- Created by CI via `make agent-heuristic` (`--llm none`)  
- Evidence under `reports/security-agent/`  
- Human must approve merge  

Show the PR diff (SQL parameterized, lodash bump, Dockerfile harden).

---

## 5. Close the loop (1–2 min)

Say the north star:

1. **Perceive** — scanners  
2. **Decide / Reason** — agent (+ Ollama locally)  
3. **Act** — patches / PR  
4. **Reflect** — tests + re-scan on the PR branch  
5. **Remember** — evidence + audit log  
6. **Escalate** — human merge  

Optional live apply locally:

```bash
make agent-apply
make test
make demo-reset   # restore vulnerable main for next rehearsal
```

---

## Cheat sheet — what to click

| Minute | Show |
|--------|------|
| 0 | Vulnerable code on `main` |
| 2 | `security-summary.json` or Actions security run |
| 4 | `make agent` + `llm-briefing.md` |
| 6 | `audit.jsonl` (`llm_chat` + denied `merge_pr`) |
| 8 | GitHub PR from **security-agent-pr** workflow |
| 9 | Docs site glossary (SAST/SCA) if time |

---

## If something breaks

| Failure | Fallback |
|---------|----------|
| Ollama down | `make agent-heuristic` + show `evidence.md` |
| Trivy DB slow | `cp fixtures/findings/* artifacts && node scripts/aggregate-security-summary.js` |
| Agent PR workflow not run | Actions → security-agent-pr → Run workflow |
| Pages 404 | Settings → Pages → Source = GitHub Actions |
| Main already “fixed” | `make demo-reset` |

---

## Commands recap

```bash
make install
make scan
make agent              # Ollama briefing (stage wow)
make agent-heuristic    # same remediations, no LLM (matches CI)
make agent-apply        # write fixes into workspace
make demo-reset         # restore intentional vulns
```
