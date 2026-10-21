#!/usr/bin/env node
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { runAgent } = require("./agent");
const { archiveAgentRun } = require("./archive");

function parseArgs(argv) {
  const args = {
    summary: "artifacts/world/security-summary.json",
    out: "artifacts/agent",
    apply: false,
    allowOpenPr: false,
    skipTests: false,
    llm: process.env.LLM_PROVIDER || "ollama",
    model: process.env.LLM_MODEL || process.env.OLLAMA_MODEL || "llama3",
    ollamaHost: process.env.OLLAMA_HOST || "http://127.0.0.1:11434",
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--summary") args.summary = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--apply") args.apply = true;
    else if (a === "--allow-open-pr") args.allowOpenPr = true;
    else if (a === "--skip-tests") args.skipTests = true;
    else if (a === "--llm") args.llm = argv[++i];
    else if (a === "--model") args.model = argv[++i];
    else if (a === "--ollama-host") args.ollamaHost = argv[++i];
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: node agents/security-agent/src/cli.js [options]

Options:
  --summary <path>     Path to security-summary.json (default: artifacts/world/…)
  --out <dir>          Output directory (default: artifacts/agent)
  --apply              Write remediations into vuln-shop
  --skip-tests         Skip validate/run_tests
  --llm <provider>     ollama | none  (openai/anthropic later)
  --model <name>       Model id (default: llama3)
  --ollama-host <url>  Ollama base URL (default: http://127.0.0.1:11434)
  --allow-open-pr      Grant OPEN_PR permission (still a stub)

Env:
  LLM_PROVIDER, LLM_MODEL, OLLAMA_HOST, OLLAMA_MODEL, OLLAMA_TIMEOUT_MS
`);
    process.exit(0);
  }

  const root = path.resolve(__dirname, "..", "..", "..");
  console.log(`LLM: ${args.llm} / ${args.model}`);
  console.log(`World summary: ${args.summary}`);
  console.log(`Agent out:     ${args.out}`);
  const result = await runAgent({
    root,
    summaryPath: path.resolve(root, args.summary),
    outDir: path.resolve(root, args.out),
    allowOpenPr: args.allowOpenPr,
    applyPatch: args.apply,
    skipTests: args.skipTests,
    llmProvider: args.llm,
    llmModel: args.model,
    llmBaseUrl: args.ollamaHost,
  });

  const archived = archiveAgentRun(result.outDir, {
    llm: result.llm && (result.llm.used ? result.llm.provider : args.llm),
    model: result.llm && result.llm.model ? result.llm.model : args.model,
    hero: result.hero && result.hero.finding_id,
    apply: args.apply,
  });

  // Sync docs/outputs/agent for GitHub Pages
  spawnSync("bash", [path.join(root, "scripts/sync-docs-outputs.sh"), "agent"], {
    cwd: root,
    stdio: "inherit",
  });

  console.log("Security agent finished.");
  console.log(`  Hero finding: ${result.hero ? result.hero.finding_id : "none"}`);
  console.log(`  Remediations: ${result.remediationCount}`);
  if (result.llm) {
    console.log(
      `  LLM:          ${result.llm.used ? `${result.llm.provider}/${result.llm.model}` : `skipped (${result.llm.error || result.llm.provider})`}`
    );
  }
  for (const p of result.patchPaths || []) {
    console.log(`  Patch:        ${p}`);
  }
  console.log(`  Evidence:     ${path.join(result.outDir, "evidence.md")}`);
  if (result.llm && result.llm.used) {
    console.log(`  Briefing:     ${path.join(result.outDir, "llm-briefing.md")}`);
  }
  console.log(`  Audit log:    ${result.auditFile}`);
  console.log(`  Run archive:  ${archived.runDir}`);
  console.log(`  Latest link:  ${path.join(result.outDir, "runs", "latest")}`);
  console.log(`  Docs mirror:  docs/outputs/agent/`);
  if (result.validation && !result.validation.skipped) {
    console.log(`  Tests:        exit ${result.validation.status}`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
