# CRACCON’26 Demo Plan — AI-Driven DevSecOps

**Talk:** AI-Driven DevSecOps (CRACCON 2026)  
**Source slides:** Security Agent Architecture, Example Security Agent, AI-Driven Security Loop, Vulnerable App → Secure PR, Demo Architecture  
**Repo today:** presentation PDF + empty project shell — demos still need to be built  

---

## 1. Goal

Build **live, evidence-backed demos** that prove the talk’s core claim:

> AI orchestrates and explains; deterministic security controls provide evidence; humans approve high-impact merges.

Audience should leave believing three things:

1. Security feedback can travel with every change (PR / CI), not arrive late as a PDF dump.
2. A bounded security agent can Observe → Reason → Plan → Act → Validate → Escalate with permissions, tool boundaries, and an audit trail.
3. The secure path can be the easiest path: one issue → one evidence-backed remediation PR.

**Demo time budget (talk):** ~8–12 minutes total for live demos (or a tight recorded fallback).

---

## 2. Recommendation: two projects, one monorepo

Use **two focused projects** under one repository rather than one mega-app. They map cleanly to two talk moments and reuse shared tooling.

| Project | Talk moment | Story in one line |
|--------|-------------|-------------------|
| **A — `vuln-shop`** | “Vulnerable App → Secure PR” + Security Loop | Bad PR has SQLi + outdated dep + insecure manifest → scans fire → AI correlates → secure PR with evidence |
| **B — `security-agent`** | “Security Agent Architecture” + Example Security Agent | Bounded agentic workflow with explicit tools, permissions, audit log; one CVE/dependency issue → evidence-backed fix PR |

**Why two projects (not one):**

- Project A is the **end-to-end product story** (developer → CI → AI → human).
- Project B is the **agent internals story** (Observe/Reason/Plan/Act/Validate/Escalate).
- Different failure modes and tooling make each demo crisp; a single app tends to become a confusing kitchen sink on stage.

**Monorepo layout (proposed):**

```text
AI-Driven-DevSecOps/
├── plan.md                          # this file
├── README.md                        # talk + how to run demos
├── docs/
│   ├── demo-script.md               # minute-by-minute stage script
│   ├── architecture.md              # diagrams + evidence model
│   └── recording-checklist.md       # backup video / slide screenshots
├── apps/
│   └── vuln-shop/                   # Project A — intentionally vulnerable API
├── agents/
│   └── security-agent/              # Project B — bounded agent + orchestration
├── policies/                        # OPA/Conftest (or similar) policy-as-code
├── fixtures/
│   ├── findings/                    # sample Semgrep/Trivy/Gitleaks SARIF
│   ├── sbom/                        # sample CycloneDX SBOM
│   └── golden/                      # expected remediation diffs / reports
└── .github/workflows/               # (or .gitlab-ci.yml) CI for both projects
```

**Alternative (if time is tight):** ship **Project A only** with a thin “agent” script that simulates Project B’s loop and audit trail. Prefer two projects if CRACCON prep time allows ≥2–3 focused weekends.

---

## 3. Demo narrative (what the audience sees)

Align with Demo Architecture (slide 30): three visual surfaces.

| Screen | Content |
|--------|---------|
| **1 — PR** | Developer opens a PR with vulnerable change |
| **2 — Evidence trail** | CI + scanners + agent correlation (Perceive/Decide or Observe/Reason) |
| **3 — Remediation** | Diff + re-scan + tests; human merge approval |
 
Shared loop (slides 23 / 28):

```text
Perceive / Observe  →  Decide / Reason+Plan  →  Act  →  Reflect / Validate  →  Remember / Escalate+Audit
```

---

## 4. Project A — `vuln-shop` (Vulnerable App → Secure PR)

### 4.1 Purpose

Practical end-to-end storyline (slide 29):

1. Start with a PR containing a **vulnerable query**, **outdated dependency**, and **insecure manifest**.
2. Run **SAST + SCA + policy** checks.
3. AI **correlates** findings and explains highest-impact issues.
4. Generate a **focused remediation patch**.
5. Run **tests + security scans**.
6. Open a **PR with diff + validation evidence**.

### 4.2 App shape (keep it tiny)

- **Stack (suggested):** Node.js + Express (or FastAPI) — one service, SQLite or in-memory DB, 3–5 endpoints.
- **Domain:** toy “shop” or “notes” API — enough realism for SQLi + authz + dependency risk; not a full product.
- **Branches for demo:**
  - `main` — mostly secure baseline (or “post-fix” state for reset).
  - `demo/vulnerable-pr` — intentional regressions for the live open.
  - `demo/secure-fix` — agent/human-ready remediation (or generated live).

### 4.3 Intentional findings (seeded, deterministic)

| Finding type | Example | Tool evidence |
|--------------|---------|---------------|
| SAST | SQL built via string concat / unsanitized query | Semgrep (or CodeQL) SARIF |
| SCA | Known vulnerable package version in lockfile | Trivy / npm audit / OSV |
| Policy | Insecure Dockerfile (`USER root`), open K8s NetworkPolicy, or missing `securityContext` | Conftest / OPA |
| Optional secrets | Fake API key in a comment or `.env.example` misuse | Gitleaks (use **fake** secrets only) |

**Rules for seeded vulns:**

- Must be **real patterns** scanners catch — no fake “demo-only” findings that tools ignore.
- Must be **safe for a public talk** (no real credentials, no weaponized exploit walkthrough beyond “here is the insecure pattern”).
- Prefer **one primary narrative path** (e.g. SQLi is “hero” finding; dep + policy are supporting).

### 4.4 CI pipeline (deterministic controls)

Jobs that always run on PR:

1. Unit / API tests  
2. SAST (Semgrep)  
3. SCA (Trivy fs or equivalent)  
4. Secrets (Gitleaks)  
5. Policy (Conftest on Dockerfile / K8s / CI config)  
6. Optional: SBOM generation (Syft → CycloneDX)  

**Output contract:** upload SARIF / JSON / SBOM as artifacts; write a single `artifacts/security-summary.json` the agent can read.

### 4.5 AI layer for Project A

Role: **orchestrate + explain**, not replace scanners.

Minimum viable AI behavior on failing PR:

1. Ingest CI artifacts + changed files.  
2. Correlate (same file / same package / reachable endpoint).  
3. Rank by impact (data exposure > dep with no usage > style).  
4. Propose minimal patch (parameterized query, bump dep, policy-compliant manifest).  
5. Emit `evidence.md` (or PR comment) with: findings cited, reasoning, patch summary, re-scan plan.  
6. **Escalate:** do not auto-merge; open/update PR for human approval.

Implementation options (pick one for the talk):

| Option | Pros | Cons |
|--------|------|------|
| **A1. Cursor Agent / Claude in IDE** (live) | Authentic “AI in the loop” | Network/stage risk |
| **A2. Scripted LLM call** (`agents/` thin client + prompt + tools) | Repeatable | Needs API key + cost |
| **A3. Pre-recorded agent transcript + live re-scan** | Zero stage failure risk | Less “live” |

**Recommended for conference reliability:** implement A2 with a **recorded fallback** (A3) of the same script; use A1 only if Wi‑Fi and API are trusted.

### 4.6 Success criteria (Project A)

- [ ] Opening the vulnerable PR fails CI with clear SAST/SCA/policy signals.  
- [ ] AI (or agent script) produces an explanation that cites **tool evidence**, not vibes.  
- [ ] Remediation PR is small and reviewable.  
- [ ] Re-run of the same scanners goes green (or findings drop as expected).  
- [ ] Human merge remains the final gate.

---

## 5. Project B — `security-agent` (Bounded Agentic Workflow)

### 5.1 Purpose

Make the **agent architecture** visible (slides 23–24):

| Phase | Behavior |
|-------|----------|
| **Observe** | PR, scanner findings, SBOM, CI results, policy violations |
| **Reason** | Correlate findings; identify likely root cause |
| **Plan** | Choose investigation / remediation steps |
| **Act** | Use **approved tools only** to inspect or generate changes |
| **Validate** | Run tests + security checks |
| **Escalate** | Request human approval when risk/ambiguity is high |

Hard requirements called out in the talk:

- Explicit **permissions**
- **Tool boundaries**
- **Auditability**
- **Failure handling**

### 5.2 Example workflow (slide 24) — “one issue → one evidence-backed workflow”

**Trigger:** PR introduces a vulnerable dependency.  

1. **Investigate** — read manifest, lockfile, SBOM, scanner evidence.  
2. **Assess** — usage, version, exposure, fixed versions available.  
3. **Remediate** — generate dependency update + tests.  
4. **Validate** — CI, SCA, relevant app tests.  
5. **Present** — open PR with evidence; leave merge to the team.

This can run against `vuln-shop` as the target app so both demos share one vulnerable dependency story.

### 5.3 Agent design (MVP)

```text
┌─────────────────────────────────────────────────────────┐
│  Security Agent Runtime                                 │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌───────────┐ │
│  │ Planner │→ │ Tools    │→ │ Patcher │→ │ Validator │ │
│  └────▲────┘  └────┬─────┘  └────┬────┘  └─────┬─────┘ │
│       │            │             │             │       │
│       └────────────┴─────────────� │
│       │            │             │             │       │
│       └────────────┴─────────────┴─────────────┘       │
│                    Audit Log + Evidence Store            │
└─────────────────────────────────────────────────────────┘
```

**Tool allowlist (examples):**

| Tool | Allowed | Denied |
|------|---------|--------|
| `read_file` / `read_manifest` / `read_lockfile` | yes | — |
| `read_sbom` / `read_sarif` | yes | — |
| `run_tests` / `run_sca` / `run_sast` | yes (local/CI) | arbitrary shell |
| `propose_patch` / `write_workspace` | yes in sandbox branch | push to `main` |
| `open_pr` / `comment_pr` | yes | merge, delete repo |
| `network_fetch` | optional, pinned domains | open internet |
| Production deploy / secret exfil | **never** | always |

**Permission model (simple for demo):**

- `READ_CODE`, `READ_FINDINGS`, `RUN_CHECKS`, `WRITE_BRANCH`, `OPEN_PR`  
- Risk tiers: `low` (comment only) → `medium` (branch + PR) → `high` (needs human token / manual merge)

**Audit log fields:** timestamp, phase, tool, inputs (redacted), outputs (hashes/paths), decision, escalate_reason.

**Failure handling:**

- Tool timeout / scanner crash → escalate with partial evidence.  
- Ambiguous root cause → stop before write; ask human.  
- Patch fails tests → do not open “greenwashed” PR; report failure.

### 5.4 Implementation sketch

- **Language:** TypeScript or Python (match `vuln-shop`).  
- **Orchestration:** linear state machine first (not a free-form agent loop) for stage reliability; optional LLM for Reason/Plan text.  
- **Inputs:** path to repo + `security-summary.json` + optional SBOM.  
- **Outputs:**
  - `out/plan.json` — planned steps  
  - `out/patch.diff` — proposed change  
  - `out/evidence.md` — human-readable trail  
  - `out/audit.jsonl` — machine audit log  
  - branch + PR (when credentials present)

### 5.5 Success criteria (Project B)

- [ ] Agent refuses disallowed tools (show a denied action in the demo).  
- [ ] Every conclusion is tied to an artifact path or finding ID.  
- [ ] Audit log shows Observe → … → Escalate/Present.  
- [ ] Dependency fix PR is openable without auto-merge.  
- [ ] Re-scan confirms the CVE/version issue is addressed.

---

## 6. Shared “Security Loop” (slide 28) — map both projects

| Loop stage | Project A | Project B |
|------------|-----------|-----------|
| **Perceive** | CI collects code + findings + policies | Observe tools load PR/SBOM/SARIF |
| **Decide** | AI ranks SQLi vs dep vs policy | Reason + Plan choose investigation steps |
| **Act** | Generate remediation patch | Approved tools write branch / tests |
| **Reflect** | Re-run tests + scans | Validate phase |
| **Remember** | Evidence in PR + artifacts | Audit log + evidence store for next run |

Call out verbally: *this loop can run at PR time, in CI, at deploy, or during incident investigation* — demos focus on **PR time**.

---

## 7. Tooling choices (ground demos in real controls)

Prefer boring, well-known tools over novel scanners.

| Layer | Suggested tool | Why |
|-------|----------------|-----|
| SAST | Semgrep (community rules + 1–2 custom) | Fast, SARIF, talk-friendly |
| SCA | Trivy | Deps + image; good for demo |
| SBOM | Syft → CycloneDX | Feeds agent “Observe” |
| Secrets | Gitleaks | Clear CI signal |
| Policy | Conftest / OPA | Matches “Policy as Code + AI” slide |
| CI | GitHub Actions **or** GitLab CI | Match where you will demo (GitHub UI is common on stage) |
| LLM | Optional; Claude/OpenAI via thin client, or Cursor live | Orchestration only |

**Principle:** scanners are source of truth; LLM never invents CVEs.

---

## 8. Evidence model (non-negotiable for the talk)

Every agent/AI claim must point at evidence:

```json
{
  "finding_id": "SEMGREP-sql-injection-1",
  "tool": "semgrep",
  "severity": "apps/vuln-shop/src/routes/search.js",
  "line": 42,
  "severity": "high",
  "root_cause_hypothesis": "Untrusted query param concatenated into SQL",
  "remediation": "Use parameterized query / query builder",
  "validation": ["unit:search.test.js", "semgrep:re-run", "ci:green"]
}
```

PR body template:

1. Summary of correlated findings  
2. Highest-impact issue + why  
3. Patch explanation  
4. Validation commands + results  
5. Residual risk / what humans must still decide  

---

## 9. Phased delivery plan

### Phase 0 — Framing (0.5 day)

- [ ] Freeze demo scope: **A + B** vs **A-only**.  
- [ ] Choose CI host (GitHub vs GitLab) and LLM strategy (live / scripted / recorded).  
- [ ] Write `docs/demo-script.md` outline (timings).  

### Phase 1 — Project A foundation (2–3 days)

- [ ] Scaffold `apps/vuln-shop` with happy-path tests.  
- [ ] Seed vulnerable branch (SQLi + outdated dep + insecure manifest).  
- [ ] Wire Semgrep, Trivy, Conftest, Gitleaks in CI.  
- [ ] Publish `security-summary.json` artifact.  
- [ ] Prove: vulnerable PR fails; secure branch passes.  

### Phase 2 — AI explanation layer for A (1–2 days)

- [ ] Prompt + script: ingest artifacts → ranked explanation → markdown evidence.  
- [ ] Golden fixtures for offline / no-API demo.  
- [ ] Optional: auto-open remediation PR from script.  

### Phase 3 — Project B agent MVP (2–4 days)

- [ ] State machine: Observe → Reason → Plan → Act → Validate → Escalate.  
- [ ] Tool allowlist + permission checks + audit JSONL.  
- [ ] Dependency-focused workflow against `vuln-shop`.  
- [ ] Demo “denied tool” + “escalate on ambiguity”.  

### Phase 4 — Stage packaging (1–2 days)

- [ ] `README.md` with one-command demo reset.  
- [ ] `docs/demo-script.md` minute-by-minute.  
- [ ] Record 3–5 min backup video of full loop.  
- [ ] Capture screenshots for slides if live CI fails.  
- [ ] Rehearse twice with airplane-mode fallback.  

### Phase 5 — Polish (optional)

- [ ] Tiny evidence UI (static HTML) showing the trail — only if it helps the third screen.  
- [ ] Policy-as-code slide alignment (AI explains Conftest failure).  
- [ ] Link repo on “Find the code here” slide.  

---

## 10. Stage script (draft, ~10 minutes)

| Min | Action | Screen |
|-----|--------|--------|
| 0:00 | Show vulnerable PR diff (SQLi + dep + Dockerfile) | PR |
| 0:90 | CI red: Semgrep / Trivy / Conftest annotations | Evidence |
| 2:30 | Run security-agent (or AI script): correlate + rank | Evidence |
| 4:00 | Show audit trail / evidence.md | Evidence |
| 5:00 | Open remediation PR; walk the diff | Remediation |
| 7:00 | CI green on fix branch; residual notes | Remediation |
| 8:30 | Emphasize: human still approves merge; agent had no merge permission | All |
| 9:30 | Optional: show denied dangerous tool in agent log | Agent |

Keep talking points short; let the PR and CI UI do the work.

---

## 11. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Conference Wi‑Fi / API outage | Offline fixtures + recorded run |
| Scanner noise / non-deterministic versions | Pin tool versions; golden SARIF for narration |
| Live LLM hallucination | Require citation of finding IDs; fail closed |
| Demo drift (`main` gets “fixed”) | `make demo-reset` restores vulnerable branch |
| Scope creep (DAST, K8s full cluster, runtime) | Explicitly out of scope for v1 demos |
| Real secrets in repo | Fake tokens only; pre-commit secret scan |

---

## 12. Explicit non-goals (v1)

- Full SOAR / production incident response bot  
- Auto-merge to `main`  
- Replacing SAST/SCA with an LLM-only scanner  
- Large microservice estate or real customer data  
- Offensive exploit development beyond illustrating insecure patterns  

---

## 13. Definition of “demo ready”

The repo is demo-ready when:

1. A new clone can run Project A’s vulnerable PR path and see failing real scanners.  
2. Project B (or the thin agent script) produces an evidence file + patch without manual IDE magic.  
3. Remediation path goes green under the same controls.  
4. A 10-minute script exists and a backup recording exists.  
5. README explains reset, required tokens, and what is safe to show publicly.  

---

## 14. Suggested first implementation tickets

1. Scaffold monorepo + `apps/vuln-shop` hello API + tests.  
2. Add intentional SQLi endpoint + failing Semgrep rule/CI job.  
3. Pin vulnerable dependency + Trivy job.  
4. Add insecure Dockerfile + Conftest policy.  
5. Aggregate CI outputs → `security-summary.json`.  
6. Build `agents/security-agent` Observe/Reason read-only mode (no writes).  
7. Add Plan/Act patch generation for parameterized query **or** dep bump (pick one hero path first).  
8. Add Validate + Escalate + audit log.  
9. Write demo script + reset tooling.  
10. Record backup + link from talk slide “Find the code here”.  

---

## 15. Decision log (fill in before coding)

| Decision | Options | Choice | Notes |
|----------|---------|--------|-------|
| Repo shape | Monorepo vs two repos | **Monorepo** | Easier for one “Find the code” link |
| App language | Node / Python / Go | **Node.js + Express** | Fast to demo; better-sqlite3 |
| CI | GitHub Actions / GitLab CI | **GitHub Actions** | `.github/workflows/security.yml` |
| LLM | Live / scripted / recorded | **Scripted agent + recorded fallback** | Deterministic Reason/Plan; LLM optional later |
| Hero finding | SQLi vs CVE dep | **SQLi (Semgrep)** | lodash CVE + Dockerfile policy support |
| Ship B for talk? | Yes / thin stub / A-only | **Yes (MVP agent shipped)** | Observe→Escalate + audit + deny merge |

---

## 16. Next step

When you are ready to build, start with **Phase 1 ticket 1–4** (vulnerable app + real CI evidence). Do not start the agent until scanners produce stable artifacts — the talk’s credibility depends on that order:

**Controls first → evidence contract → agent on top → stage packaging.**
