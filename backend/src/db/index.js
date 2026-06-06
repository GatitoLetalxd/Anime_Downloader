const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "lunielanime",
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected error on idle client", err);
});

/**
 * Execute a parameterised SQL query.
 * @param {string} text   - SQL query string
 * @param {Array}  params - Query parameters
 */
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== "production") {
    console.log(`[DB] query: ${text.slice(0, 80)} — ${duration}ms`);
  }
  return res;
}

/**
 * Get a client from the pool (for transactions).
 */
async function getClient() {
  return pool.connect();
}

module.exports = { query, getClient, pool };
