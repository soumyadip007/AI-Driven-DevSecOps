#!/usr/bin/env node
const path = require("node:path");
const { runAgent } = require("./agent");

function parseArgs(argv) {
  const args = {
    summary: "artifacts/security-summary.json",
    out: "agents/security-agent/out",
    apply: false,
    allowOpenPr: false,
    skipTests: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--summary") args.summary = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--apply") args.apply = true;
    else if (a === "--allow-open-pr") args.allowOpenPr = true;
    else if (a === "--skip-tests") args.skipTests = true;
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: node agents/security-agent/src/cli.js [options]

Options:
  --summary <path>   Path to security-summary.json (default: artifacts/security-summary.json)
  --out <dir>        Output directory (default: agents/security-agent/out)
  --apply            Write remediation into apps/vuln-shop (default: propose only)
  --skip-tests       Skip validate/run_tests
  --allow-open-pr    Grant OPEN_PR permission (still a stub)
`);
    process.exit(0);
  }

  const root = path.resolve(__dirname, "..", "..", "..");
  const result = await runAgent({
    root,
    summaryPath: path.resolve(root, args.summary),
    outDir: path.resolve(root, args.out),
    allowOpenPr: args.allowOpenPr,
    applyPatch: args.apply,
    skipTests: args.skipTests,
  });

  console.log("Security agent finished.");
  console.log(`  Hero finding: ${result.hero ? result.hero.finding_id : "none"}`);
  console.log(`  Remediations: ${result.remediationCount}`);
  for (const p of result.patchPaths || []) {
    console.log(`  Patch:        ${p}`);
  }
  console.log(`  Evidence:     ${path.join(result.outDir, "evidence.md")}`);
  console.log(`  Audit log:    ${result.auditFile}`);
  if (result.validation && !result.validation.skipped) {
    console.log(`  Tests:        exit ${result.validation.status}`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
