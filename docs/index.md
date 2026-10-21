# AI-Driven DevSecOps

Demo documentation for the **CRACCON’26** talk: security as a continuous feedback loop.

> AI orchestrates and explains; deterministic security controls provide evidence; humans approve merges.

## Start here

| Page | What you’ll learn |
|------|-------------------|
| [Glossary](concepts/glossary.md) | What **SAST**, **SCA**, **Semgrep**, **Trivy**, **Conftest**, **SBOM**, and related terms mean |
| [Projects](projects.md) | What `vuln-shop` and `security-agent` do, and how they connect |
| [Security loop](concepts/security-loop.md) | Perceive → Decide → Act → Reflect → Remember |
| [Tooling](tooling.md) | Install scanners and run `make scan` / `make agent` |
| [CI explained](ci.md) | Security CI (world) + Agent PR |
| [**Outputs**](outputs/index.md) | Clickable world + agent files on this site |
| [Stage script](demo-script.md) | Minute-by-minute talk flow |

## Quick commands

```bash
make install
make test
make scan          # Semgrep + Trivy + Conftest → artifacts/security-summary.json
make agent         # Propose remediations + evidence (no merge)
```

## Repository

- Code: [github.com/soumyadip007/AI-Driven-DevSecOps](https://github.com/soumyadip007/AI-Driven-DevSecOps)
- This site is built with [MkDocs Material](https://squidfunk.github.io/mkdocs-material/) and published via GitHub Pages.
