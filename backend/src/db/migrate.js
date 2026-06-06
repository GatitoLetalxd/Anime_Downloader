/**
 * migrate.js — Runs the schema.sql file against the database.
 * Usage: node src/db/migrate.js
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const fs = require("fs");
const path = require("path");
const { pool } = require("./index");

async function migrate() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");

  console.log("[Migrate] Connecting to database...");
  const client = await pool.connect();

  try {
    console.log("[Migrate] Running schema.sql...");
    await client.query(sql);
    console.log("[Migrate] ✅ Schema applied successfully.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("[Migrate] ❌ Error:", err.message);
  process.exit(1);
});
