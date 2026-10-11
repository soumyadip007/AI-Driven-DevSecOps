const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DB_PATH = process.env.VULN_SHOP_DB || path.join(DATA_DIR, "shop.db");

function ensureSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      category TEXT NOT NULL
    );
  `);
}

function openDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  ensureSchema(db);
  return db;
}

function seedIfEmpty(db) {
  const count = db.prepare("SELECT COUNT(*) AS c FROM products").get().c;
  if (count > 0) return;

  const insert = db.prepare(
    "INSERT INTO products (name, price_cents, category) VALUES (?, ?, ?)"
  );
  const rows = [
    ["Wireless Mouse", 2499, "accessories"],
    ["USB-C Hub", 4999, "accessories"],
    ["Laptop Stand", 3999, "desk"],
    ["Mechanical Keyboard", 8999, "accessories"],
    ["Monitor Light", 2999, "desk"],
  ];
  const tx = db.transaction((items) => {
    for (const item of items) insert.run(...item);
  });
  tx(rows);
}

module.exports = { openDb, ensureSchema, seedIfEmpty, DB_PATH };
