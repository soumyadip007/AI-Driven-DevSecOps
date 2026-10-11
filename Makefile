.PHONY: install test scan agent agent-apply demo-reset help

ROOT := $(abspath .)

help:
	@echo "Targets:"
	@echo "  make install       Install vuln-shop deps"
	@echo "  make test          Run vuln-shop unit tests"
	@echo "  make scan          Run local scanners + aggregate summary"
	@echo "  make agent         Run security agent (propose patch only)"
	@echo "  make agent-apply   Run agent and apply SQL remediation"
	@echo "  make demo-reset    Restore vulnerable products.js from git"

install:
	cd apps/vuln-shop && npm install

test:
	cd apps/vuln-shop && npm test

scan:
	bash scripts/run-local-scans.sh

agent:
	node agents/security-agent/src/cli.js --summary artifacts/security-summary.json

agent-apply:
	node agents/security-agent/src/cli.js --summary artifacts/security-summary.json --apply

demo-reset:
	git checkout -- apps/vuln-shop/src/routes/products.js apps/vuln-shop/Dockerfile apps/vuln-shop/package.json
	@echo "Restored vulnerable demo files (if tracked)."
	@echo "If package-lock changed after a lodash bump, also run: git checkout -- apps/vuln-shop/package-lock.json"
