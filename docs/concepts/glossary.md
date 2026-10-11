# Glossary — SAST, SCA, Semgrep, and friends

Short definitions for every security term used in this demo.  
If a word appears in CI job names or docs, it should be here.

---

## Application under test

### vuln-shop

Tiny Express + SQLite shop API in `apps/vuln-shop`.  
It is **intentionally insecure** so real scanners have something to catch (SQL injection, old dependency, bad Dockerfile).

### security-agent

Bounded agent in `agents/security-agent`.  
It reads scanner evidence, correlates findings, proposes remediations, runs tests, and **escalates to a human** (it cannot merge).

---

## Testing & analysis types

### SAST — Static Application Security Testing

Analyzes **source code** (or bytecode) **without running** the app.  
Looks for insecure patterns: SQL injection, XSS sinks, dangerous APIs, etc.

| In this demo | Tool | Example finding |
|--------------|------|-----------------|
| SAST job | **Semgrep** | String-concat SQL in product search |

**Why it matters:** catches bugs early, at PR time, before deploy.

### SCA — Software Composition Analysis

Analyzes **third-party dependencies** (direct + transitive) for known vulnerabilities (CVEs), licenses, and outdated packages.

| In this demo | Tool | Example finding |
|--------------|------|-----------------|
| SCA job | **Trivy** | `lodash@4.17.19` with known HIGH CVEs |

**Why it matters:** most of a modern app’s code is not yours — it’s open-source libraries.

### DAST — Dynamic Application Security Testing

Tests a **running** application from the outside (HTTP requests, crawl, auth flows).  
**Not used in v1 of this demo** (kept out of scope for stage reliability).

### Secrets scanning

Searches repos and history for leaked credentials (API keys, tokens, passwords).

| In this demo | Tool |
|--------------|------|
| Config present | **Gitleaks** (`policies/gitleaks.toml`) |

### Policy as code

Expresses security/compliance rules as code (Rego, YAML, etc.) and evaluates configs/IaC/containers against them.

| In this demo | Tool | Example finding |
|--------------|------|-----------------|
| Policy job | **Conftest** + OPA Rego | Dockerfile missing non-root `USER` / `HEALTHCHECK` |

---

## Tools used in this repo

### Semgrep

Fast, rule-based **SAST** engine. You write patterns (or use packs) that match insecure code.  
Outputs JSON/SARIF that CI and the agent can read.

- Config: `policies/semgrep/`
- CI job: `sast-semgrep`
- Local: `semgrep scan --config policies/semgrep apps/vuln-shop`

### Trivy

Security scanner from Aqua for **filesystems, images, and configs**.  
In this demo we use it for **SCA** (npm lockfile / project deps).

- CI job: `sca-trivy`
- Local: `trivy fs apps/vuln-shop`

### Conftest

CLI that runs **OPA Rego** policies against structured files (Dockerfile, Kubernetes YAML, Terraform, …).

- Policies: `policies/conftest/`
- CI job: `policy-conftest`
- Local: `conftest test apps/vuln-shop/Dockerfile --policy policies/conftest`

### OPA — Open Policy Agent

General policy engine. Conftest is a convenient way to run OPA policies on files in CI.

### Gitleaks

Detects hard-coded secrets using signatures/regex. Demo keeps only **fake** examples.

### Syft / CycloneDX (optional)

**Syft** generates an **SBOM**. **CycloneDX** is a common SBOM format.  
Useful for the agent’s Observe phase (“what dependencies exist?”). Optional in v1.

---

## Supply-chain & evidence terms

### SBOM — Software Bill of Materials

Inventory of components in an application (packages, versions, licenses).  
Think “ingredient list” for software — used for SCA, compliance, and incident response.

### CVE — Common Vulnerabilities and Exposures

Public ID for a known vulnerability (e.g. `CVE-2021-23337`).  
SCA tools map package versions → CVEs.

### SARIF — Static Analysis Results Interchange Format

Standard JSON format for sharing static analysis findings across tools and platforms (GitHub code scanning, IDEs, aggregators).

### Finding

One security issue reported by a tool: rule/CVE, severity, file/location, message.  
Normalized here into `artifacts/security-summary.json` with a `finding_id`.

### Severity

How serious a finding is (CRITICAL / HIGH / MEDIUM / LOW / INFO).  
Used by the agent to rank the “hero” issue.

---

## AI / agent terms (this talk)

### Bounded agent

An agent with **explicit permissions**, an **allowlisted tool set**, **audit logs**, and **escalation** when risk or ambiguity is high.  
It may propose patches; it must not silently merge to production.

### Observe → Reason → Plan → Act → Validate → Escalate

Phases of the security agent workflow (see [security loop](security-loop.md)).

### Human-in-the-loop (HIL)

Humans approve high-impact changes, resolve ambiguity, and own exceptions.  
AI assists; accountability stays with people and policy engines.

### Evidence trail

Artifacts that justify a conclusion: scanner JSON, `security-summary.json`, `evidence.md`, `audit.jsonl`, PR diff.  
The agent should **show** evidence, not merely state a conclusion.

---

## CI terms

### GitHub Actions

Hosted CI/CD used by this repo (`.github/workflows/`).

### Artifact

File retained from a workflow run (e.g. `security-summary`, `semgrep-json`) for download or the next job.

### Security gate

A check that can block merge when findings remain.  
In this demo, scanners **collect** findings into artifacts; the talk narrative treats those findings as the gate the agent then helps remediate.

---

## Quick map: term → demo piece

```text
SAST        → Semgrep        → products.js SQL concat
SCA         → Trivy          → lodash@4.17.19
Policy      → Conftest/OPA   → insecure Dockerfile
Secrets     → Gitleaks       → fake example only
Evidence    → security-summary.json → security-agent
Remediation → agent patches  → human merge approval
```
