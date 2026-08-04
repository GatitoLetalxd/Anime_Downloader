const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.PG_HOST || process.env.DB_HOST || "localhost",
  port: Number(process.env.PG_PORT) || 5432,
  user: process.env.PG_USERNAME || process.env.DB_USERNAME,
  password: process.env.PG_PASSWORD || process.env.DB_PASSWORD,
  database: process.env.PG_NAME || "lunielanime",
});

pool.on("error", (err) => {
  console.error("[PG] Unexpected error on idle client", err);
});

async function query(text, params) {
  return pool.query(text, params);
}

async function getClient() {
  return pool.connect();
}

module.exports = { query, getClient, pool };
