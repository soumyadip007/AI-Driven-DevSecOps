const LODASH_FIXED = "4.17.21";

function buildSecureSearchPatch() {
  return `const express = require("express");
const _ = require("lodash");

/**
 * Product routes for the demo shop.
 * Remediation: parameterized LIKE query (no string-concat SQL).
 */
function createProductRouter(db) {
  const router = express.Router();

  router.get("/", (_req, res) => {
    const products = db
      .prepare(
        "SELECT id, name, price_cents, category FROM products ORDER BY id"
      )
      .all();
    res.json({ products });
  });

  router.get("/search", (req, res) => {
    const q = _.get(req, "query.q", "");
    if (typeof q !== "string" || q.length === 0) {
      return res.status(400).json({ error: "query parameter q is required" });
    }
    if (q.length > 100) {
      return res.status(400).json({ error: "query too long" });
    }

    const sql = \`
      SELECT id, name, price_cents, category
      FROM products
      WHERE name LIKE ? OR category LIKE ?
    \`;
    const pattern = \`%\${q}%\`;
    const products = db.prepare(sql).all(pattern, pattern);
    res.json({ query: q, products });
  });

  router.get("/:id", (req, res) => {
    const product = db
      .prepare(
        "SELECT id, name, price_cents, category FROM products WHERE id = ?"
      )
      .get(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ error: "product not found" });
    }
    res.json({ product });
  });

  return router;
}

module.exports = { createProductRouter };
`;
}

function buildSecureDockerfile() {
  return `# Secure remediation for the demo Dockerfile (Conftest-compliant).
FROM node:20-bookworm

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY . .

RUN groupadd --system app && useradd --system --gid app app \\
  && chown -R app:app /app
USER app

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://127.0.0.1:3000/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "src/server.js"]
`;
}

function bumpLodashInPackageJson(raw) {
  const pkg = JSON.parse(raw);
  if (!pkg.dependencies) pkg.dependencies = {};
  const previous = pkg.dependencies.lodash;
  pkg.dependencies.lodash = LODASH_FIXED;
  return {
    content: `${JSON.stringify(pkg, null, 2)}\n`,
    previous,
    next: LODASH_FIXED,
  };
}

function needsSqlRemediation(findings) {
  return findings.some(
    (f) =>
      f.category === "sast" ||
      /sql|sqlite-string-concat/i.test(`${f.rule_id || ""} ${f.message || ""}`)
  );
}

function needsLodashBump(findings) {
  return findings.some(
    (f) =>
      f.category === "sca" &&
      /lodash/i.test(`${f.package || ""} ${f.message || ""}`)
  );
}

function needsDockerfileRemediation(findings) {
  return findings.some(
    (f) =>
      f.category === "policy" ||
      /Dockerfile|USER|HEALTHCHECK/i.test(`${f.message || ""} ${f.filepath || ""}`)
  );
}

/**
 * Build remediation artifacts from correlated findings.
 * Returns proposed file contents + plan steps (does not write workspace).
 */
function buildRemediations({ root, findings, tools }) {
  const actions = [];
  const steps = [];
  const proposed = [];

  if (needsSqlRemediation(findings)) {
    steps.push("Remediate SQL injection with parameterized product search query");
    const content = buildSecureSearchPatch();
    proposed.push({
      kind: "sast",
      outName: "products.remediated.js",
      targetRel: "apps/vuln-shop/src/routes/products.js",
      content,
      summary: "Parameterized LIKE query for /api/products/search",
    });
    actions.push("Generated SQL remediation patch (products.remediated.js)");
  }

  if (needsLodashBump(findings)) {
    steps.push(`Bump lodash to ${LODASH_FIXED} in package.json (SCA)`);
    const manifestRel = "apps/vuln-shop/package.json";
    const rawText = tools.read_file(manifestRel);
    const bumped = bumpLodashInPackageJson(rawText);
    proposed.push({
      kind: "sca",
      outName: "package.json.remediated",
      targetRel: manifestRel,
      content: bumped.content,
      summary: `lodash ${bumped.previous || "?"} → ${bumped.next}`,
      followUp: "Run npm install in apps/vuln-shop to refresh package-lock.json",
    });
    actions.push(
      `Generated dependency bump patch (lodash → ${LODASH_FIXED})`
    );
  }

  if (needsDockerfileRemediation(findings)) {
    steps.push("Harden Dockerfile: non-root USER + HEALTHCHECK (policy)");
    const content = buildSecureDockerfile();
    proposed.push({
      kind: "policy",
      outName: "Dockerfile.remediated",
      targetRel: "apps/vuln-shop/Dockerfile",
      content,
      summary: "Non-root USER app + HEALTHCHECK on /health",
    });
    actions.push("Generated Dockerfile remediation (Dockerfile.remediated)");
  }

  if (steps.length === 0) {
    steps.push("No known remediation templates matched; escalate to human");
  }

  steps.push("Run unit tests");
  steps.push("Present evidence for human PR approval (no auto-merge)");

  return { steps, proposed, actions };
}

module.exports = {
  LODASH_FIXED,
  buildSecureSearchPatch,
  buildSecureDockerfile,
  bumpLodashInPackageJson,
  buildRemediations,
  needsSqlRemediation,
  needsLodashBump,
  needsDockerfileRemediation,
};
