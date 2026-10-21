#!/usr/bin/env node
/**
 * Aggregate scanner outputs into artifacts/world/security-summary.json
 * for the security agent Observe phase.
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ARTIFACTS =
  process.env.ARTIFACTS_DIR || path.join(ROOT, "artifacts", "world");

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function readText(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function fromSemgrep(sarifOrJson) {
  if (!sarifOrJson) return [];
  // Semgrep --json
  if (Array.isArray(sarifOrJson.results)) {
    return sarifOrJson.results.map((r, idx) => ({
      finding_id: `SEMGREP-${r.check_id || "rule"}-${idx + 1}`,
      tool: "semgrep",
      severity: (r.extra && r.extra.severity) || "ERROR",
      rule_id: r.check_id,
      message: (r.extra && r.extra.message) || r.check_id,
      filepath: r.path,
      line: r.start && r.start.line,
      category: "sast",
    }));
  }
  // SARIF
  const runs = sarifOrJson.runs || [];
  const findings = [];
  for (const run of runs) {
    for (const result of run.results || []) {
      const loc = (((result.locations || [])[0] || {}).physicalLocation || {})
        .artifactLocation;
      const region = (((result.locations || [])[0] || {}).physicalLocation || {})
        .region;
      findings.push({
        finding_id: `SEMGREP-${result.ruleId}-${findings.length + 1}`,
        tool: "semgrep",
        severity: result.level || "error",
        rule_id: result.ruleId,
        message: (result.message && result.message.text) || result.ruleId,
        filepath: loc && loc.uri,
        line: region && region.startLine,
        category: "sast",
      });
    }
  }
  return findings;
}

function fromTrivy(report) {
  if (!report) return [];
  const findings = [];
  const results = Array.isArray(report) ? report : report.Results || [];
  for (const result of results) {
    for (const vuln of result.Vulnerabilities || []) {
      findings.push({
        finding_id: `TRIVY-${vuln.VulnerabilityID}-${findings.length + 1}`,
        tool: "trivy",
        severity: vuln.Severity,
        rule_id: vuln.VulnerabilityID,
        message: `${vuln.PkgName}@${vuln.InstalledVersion}: ${vuln.Title || vuln.VulnerabilityID}`,
        filepath: result.Target,
        package: vuln.PkgName,
        installed_version: vuln.InstalledVersion,
        fixed_version: vuln.FixedVersion || null,
        category: "sca",
      });
    }
  }
  return findings;
}

function fromConftest(reportOrText) {
  if (!reportOrText) return [];
  if (typeof reportOrText === "string") {
    const lines = reportOrText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return lines.map((line, idx) => ({
      finding_id: `CONFTEST-${idx + 1}`,
      tool: "conftest",
      severity: "HIGH",
      rule_id: "dockerfile.policy",
      message: line,
      filepath: "apps/vuln-shop/Dockerfile",
      category: "policy",
    }));
  }
  if (!Array.isArray(reportOrText)) return [];
  const findings = [];
  for (const file of reportOrText) {
    for (const failure of file.failures || []) {
      findings.push({
        finding_id: `CONFTEST-${findings.length + 1}`,
        tool: "conftest",
        severity: "HIGH",
        rule_id: failure.rule || "policy",
        message: failure.msg || failure.message || JSON.stringify(failure),
        filepath: file.filename || "apps/vuln-shop/Dockerfile",
        category: "policy",
      });
    }
  }
  return findings;
}

function fromGitleaks(report) {
  if (!Array.isArray(report)) return [];
  return report.map((r, idx) => ({
    finding_id: `GITLEAKS-${idx + 1}`,
    tool: "gitleaks",
    severity: "HIGH",
    rule_id: r.RuleID || r.Description,
    message: r.Description || "Potential secret detected",
    filepath: r.File,
    line: r.StartLine,
    category: "secrets",
  }));
}

function main() {
  fs.mkdirSync(ARTIFACTS, { recursive: true });

  const semgrep =
    readJson(path.join(ARTIFACTS, "semgrep.json")) ||
    readJson(path.join(ARTIFACTS, "semgrep.sarif.json"));
  const trivy = readJson(path.join(ARTIFACTS, "trivy.json"));
  const conftestJson = readJson(path.join(ARTIFACTS, "conftest.json"));
  const conftestText = readText(path.join(ARTIFACTS, "conftest.txt"));
  const gitleaks = readJson(path.join(ARTIFACTS, "gitleaks.json"));

  const findings = [
    ...fromSemgrep(semgrep),
    ...fromTrivy(trivy),
    ...fromConftest(conftestJson || conftestText),
    ...fromGitleaks(gitleaks),
  ];

  const severityRank = {
    CRITICAL: 5,
    ERROR: 4,
    HIGH: 4,
    MEDIUM: 3,
    WARNING: 3,
    LOW: 2,
    INFO: 1,
    NOTE: 1,
  };

  findings.sort(
    (a, b) =>
      (severityRank[String(b.severity).toUpperCase()] || 0) -
      (severityRank[String(a.severity).toUpperCase()] || 0)
  );

  const summary = {
    generated_at: new Date().toISOString(),
    source: "scripts/aggregate-security-summary.js",
    counts: {
      total: findings.length,
      sast: findings.filter((f) => f.category === "sast").length,
      sca: findings.filter((f) => f.category === "sca").length,
      policy: findings.filter((f) => f.category === "policy").length,
      secrets: findings.filter((f) => f.category === "secrets").length,
    },
    findings,
  };

  const out = path.join(ARTIFACTS, "security-summary.json");
  fs.writeFileSync(out, JSON.stringify(summary, null, 2));
  console.log(`Wrote ${out} (${findings.length} findings)`);
}

main();
