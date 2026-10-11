/**
 * Golden secure remediation for GET /api/products/search
 * (parameterized LIKE query — drop-in replacement for the vulnerable block).
 */
function searchProductsSecure(db, q) {
  const sql = `
    SELECT id, name, price_cents, category
    FROM products
    WHERE name LIKE ? OR category LIKE ?
  `;
  const pattern = `%${q}%`;
  return db.prepare(sql).all(pattern, pattern);
}

module.exports = { searchProductsSecure };
