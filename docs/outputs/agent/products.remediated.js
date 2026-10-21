const express = require("express");
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

    const sql = `
      SELECT id, name, price_cents, category
      FROM products
      WHERE name LIKE ? OR category LIKE ?
    `;
    const pattern = `%${q}%`;
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
