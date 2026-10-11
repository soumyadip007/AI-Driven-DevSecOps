const fs = require("node:fs");
const path = require("node:path");

function createAuditLog(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, "audit.jsonl");
  fs.writeFileSync(file, "");

  return {
    file,
    record(entry) {
      const line = JSON.stringify({
        timestamp: new Date().toISOString(),
        ...entry,
      });
      fs.appendFileSync(file, `${line}\n`);
    },
  };
}

module.exports = { createAuditLog };
