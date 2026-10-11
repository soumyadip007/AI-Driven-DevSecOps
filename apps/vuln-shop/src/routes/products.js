const express = require("express");
const _ = require("lodash");

/**
 * Product routes for the demo shop.
 *
 * INTENTIONAL DEMO VULNERABILITY (SAST hero finding):
 * GET /api/products/search concatenates untrusted input into SQL.
 * Semgrep rule: policies/semgrep/sql-injection.yaml
 *
 * Secure remediation (see fixtures/golden/products.search.secure.js):
 * use a parameterized query with bound parameters.
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

    // DEMO ONLY — do not copy this pattern.
    // Untrusted input is concatenated into the SQL string (SQL injection).
    const sql = `SELECT id, name, price_cents, category FROM products WHERE name LIKE '%${q}%' OR category LIKE '%${q}%'`;
    const products = db.prepare(sql).all();
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
