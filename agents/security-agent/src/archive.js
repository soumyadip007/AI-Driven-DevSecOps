const fs = require("node:fs");
const path = require("node:path");

/**
 * Snapshot agent out/ into out/runs/<timestamp>/ and point out/runs/latest at it.
 * Keeps distinction between demo rehearsals / CI runs.
 */
function archiveAgentRun(outDir, meta = {}) {
  // Local-friendly: YYYYMMDD-HHMMSS
  const localStamp =
    meta.stamp ||
    (() => {
      const d = new Date();
      const p = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
    })();

  const runsDir = path.join(outDir, "runs");
  const runDir = path.join(runsDir, localStamp);
  fs.mkdirSync(runDir, { recursive: true });

  const files = fs.existsSync(outDir)
    ? fs.readdirSync(outDir).filter((name) => {
        if (name === "runs") return false;
        const abs = path.join(outDir, name);
        return fs.statSync(abs).isFile();
      })
    : [];

  for (const name of files) {
    fs.copyFileSync(path.join(outDir, name), path.join(runDir, name));
  }

  const readme = [
    "Agent run archive",
    "=================",
    `timestamp: ${localStamp}`,
    `created:   ${new Date().toISOString()}`,
    `llm:       ${meta.llm || "n/a"}`,
    `model:     ${meta.model || "n/a"}`,
    `hero:      ${meta.hero || "n/a"}`,
    `apply:     ${meta.apply ? "yes" : "no"}`,
    "",
    "Latest outputs also remain in artifacts/agent/ for the current demo.",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(runDir, "README.txt"), readme);

  // Symlink latest → this run (relative target for portability)
  const latest = path.join(runsDir, "latest");
  try {
    fs.rmSync(latest, { force: true, recursive: true });
  } catch {
    /* ignore */
  }
  try {
    fs.symlinkSync(localStamp, latest);
  } catch {
    // Windows / restricted FS fallback: write a pointer file
    fs.writeFileSync(latest + ".txt", `${localStamp}\n`);
  }

  return { stamp: localStamp, runDir };
}

module.exports = { archiveAgentRun };
