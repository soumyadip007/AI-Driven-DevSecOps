const express = require("express");
const { openDb, ensureSchema, seedIfEmpty } = require("./db/init");
const { createProductRouter } = require("./routes/products");

function createApp(options = {}) {
  const db = options.db || openDb();
  ensureSchema(db);
  seedIfEmpty(db);

  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "vuln-shop" });
  });

  app.use("/api/products", createProductRouter(db));

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  });

  return { app, db };
}

module.exports = { createApp };
