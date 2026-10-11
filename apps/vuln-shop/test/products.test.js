const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const Database = require("better-sqlite3");
const { createApp } = require("../src/app");

function request(server, method, path) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    const req = http.request(
      { hostname: "127.0.0.1", port, path, method },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            body: body ? JSON.parse(body) : null,
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

describe("vuln-shop products API", () => {
  let db;
  let server;

  before(async () => {
    db = new Database(":memory:");
    const { app } = createApp({ db });
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    db.close();
  });

  it("returns health", async () => {
    const res = await request(server, "GET", "/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
  });

  it("lists seeded products", async () => {
    const res = await request(server, "GET", "/api/products");
    assert.equal(res.status, 200);
    assert.ok(res.body.products.length >= 3);
  });

  it("searches products by name substring", async () => {
    const res = await request(server, "GET", "/api/products/search?q=Mouse");
    assert.equal(res.status, 200);
    assert.equal(res.body.products.length, 1);
    assert.equal(res.body.products[0].name, "Wireless Mouse");
  });

  it("rejects empty search query", async () => {
    const res = await request(server, "GET", "/api/products/search?q=");
    assert.equal(res.status, 400);
  });

  it("fetches product by id", async () => {
    const res = await request(server, "GET", "/api/products/1");
    assert.equal(res.status, 200);
    assert.equal(res.body.product.id, 1);
  });
});
