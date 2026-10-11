const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function createTools({ root, perms, audit }) {
  function wrap(name, fn) {
    return (...args) => {
      try {
        perms.assertTool(name);
        const result = fn(...args);
        audit.record({
          phase: "act",
          tool: name,
          status: "ok",
          detail: summarize(result),
        });
        return result;
      } catch (err) {
        audit.record({
          phase: "act",
          tool: name,
          status: "denied_or_error",
          error: err.message,
          code: err.code || "ERROR",
        });
        throw err;
      }
    };
  }

  return {
    read_security_summary: wrap("read_security_summary", (summaryPath) => {
      const abs = path.resolve(root, summaryPath);
      return JSON.parse(fs.readFileSync(abs, "utf8"));
    }),
    read_file: wrap("read_file", (rel) => {
      const abs = path.resolve(root, rel);
      if (!abs.startsWith(root)) {
        throw Object.assign(new Error("Path escapes workspace"), {
          code: "TOOL_DENIED",
        });
      }
      return fs.readFileSync(abs, "utf8");
    }),
    read_manifest: wrap("read_manifest", (rel) => {
      const abs = path.resolve(root, rel);
      return JSON.parse(fs.readFileSync(abs, "utf8"));
    }),
    propose_patch: wrap("propose_patch", ({ outDir, filename, content }) => {
      fs.mkdirSync(outDir, { recursive: true });
      const target = path.join(outDir, filename);
      fs.writeFileSync(target, content);
      return { path: target, bytes: Buffer.byteLength(content) };
    }),
    write_evidence: wrap("write_evidence", ({ outDir, filename, content }) => {
      fs.mkdirSync(outDir, { recursive: true });
      const target = path.join(outDir, filename);
      fs.writeFileSync(target, content);
      return { path: target };
    }),
    run_tests: wrap("run_tests", () => {
      const cwd = path.join(root, "apps", "vuln-shop");
      const result = spawnSync("npm", ["test"], {
        cwd,
        encoding: "utf8",
        env: process.env,
      });
      return {
        status: result.status,
        stdout: (result.stdout || "").slice(0, 4000),
        stderr: (result.stderr || "").slice(0, 2000),
      };
    }),
    open_pr: wrap("open_pr", () => {
      throw Object.assign(
        new Error("open_pr is a stub in MVP — create PR manually or via gh"),
        { code: "NOT_IMPLEMENTED" }
      );
    }),
  };
}

function summarize(result) {
  if (result == null) return null;
  if (typeof result === "string") return { length: result.length };
  if (result.findings) return { findings: result.findings.length };
  if (result.path) return { path: result.path };
  if (typeof result.status === "number") return { status: result.status };
  return { keys: Object.keys(result) };
}

module.exports = { createTools };
