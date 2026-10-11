# LLM integration (Ollama now, other models later)

## Are we using an LLM?

**Yes, optionally.** Default CLI path uses **local Ollama** (`llama3`) for the audience briefing.

Deterministic pieces still win:

| Concern | Source of truth |
|---------|-----------------|
| Findings / CVEs | Semgrep, Trivy, Conftest |
| Hero finding selection | Heuristic rank/correlate in `agent.js` |
| Patch content | Templates in `remediations.js` |
| Merge | **Denied** — human only |
| Audience explanation | **Ollama** (or `--llm none`) |

## Provider plug-in

```text
agents/security-agent/src/llm/
  provider.js   # factory: ollama | none | (openai/anthropic stubs)
  ollama.js     # local /api/chat
  reason.js     # prompts + enrichWithLlm()
```

Same `chat({ system, user })` interface — swap `--llm` later without rewriting the agent loop.

## Commands

```bash
# Ollama must be running: ollama serve  (and model pulled)
make agent                 # --llm ollama --model llama3
make agent-heuristic       # no LLM — rules only

# Explicit:
node agents/security-agent/src/cli.js \
  --summary artifacts/security-summary.json \
  --llm ollama \
  --model llama3
```

Env vars: `LLM_PROVIDER`, `LLM_MODEL`, `OLLAMA_HOST`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT_MS`.

## Audience outputs

After a successful Ollama run, show:

1. `agents/security-agent/out/llm-briefing.md` — model narrative  
2. `agents/security-agent/out/evidence.md` — briefing + finding IDs + patches  
3. `agents/security-agent/out/audit.jsonl` — includes `llm_chat` lines  
