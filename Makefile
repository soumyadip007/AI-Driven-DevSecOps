.PHONY: install test scan agent agent-heuristic agent-apply demo-reset docs docs-serve docs-install sync-outputs help

ROOT := $(abspath .)

help:
	@echo "Targets:"
	@echo "  make install          Install vuln-shop deps"
	@echo "  make test             Run vuln-shop unit tests"
	@echo "  make scan             Security world → artifacts/world/ (+ docs/outputs/world)"
	@echo "  make agent            Agent + Ollama → artifacts/agent/ (+ docs/outputs/agent)"
	@echo "  make agent-heuristic  Agent without LLM"
	@echo "  make agent-apply      Agent+Ollama and apply remediations"
	@echo "  make sync-outputs     Mirror world/agent into docs/outputs for Pages"
	@echo "  make demo-reset       Restore vulnerable demo files from git"
	@echo "  make docs-install     Install MkDocs deps"
	@echo "  make docs             Build docs site into ./site"
	@echo "  make docs-serve       Serve docs locally (http://127.0.0.1:8000)"

install:
	cd apps/vuln-shop && npm install

test:
	cd apps/vuln-shop && npm test

scan:
	bash scripts/run-local-scans.sh

agent:
	node agents/security-agent/src/cli.js \
		--summary artifacts/world/security-summary.json \
		--out artifacts/agent \
		--llm ollama --model llama3

agent-heuristic:
	node agents/security-agent/src/cli.js \
		--summary artifacts/world/security-summary.json \
		--out artifacts/agent \
		--llm none

agent-apply:
	node agents/security-agent/src/cli.js \
		--summary artifacts/world/security-summary.json \
		--out artifacts/agent \
		--llm ollama --model llama3 --apply

sync-outputs:
	bash scripts/sync-docs-outputs.sh all

demo-reset:
	git checkout -- apps/vuln-shop/src/routes/products.js apps/vuln-shop/Dockerfile apps/vuln-shop/package.json
	@echo "Restored vulnerable demo files (if tracked)."
	@echo "If package-lock changed after a lodash bump, also run: git checkout -- apps/vuln-shop/package-lock.json"

docs-install:
	python3 -m venv .venv-docs
	.venv-docs/bin/pip install -U pip
	.venv-docs/bin/pip install -r requirements-docs.txt

docs:
	@test -x .venv-docs/bin/mkdocs || $(MAKE) docs-install
	bash scripts/sync-docs-outputs.sh all || true
	.venv-docs/bin/mkdocs build --strict

docs-serve:
	@test -x .venv-docs/bin/mkdocs || $(MAKE) docs-install
	bash scripts/sync-docs-outputs.sh all || true
	.venv-docs/bin/mkdocs serve
