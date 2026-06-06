/**
 * seed-admin.js — Creates the first admin user.
 * Usage: node src/db/seed-admin.js
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const readline = require("readline");
const bcrypt = require("bcryptjs");
const { pool, query } = require("./index");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function seedAdmin() {
  console.log("\n🌱  LunielAnime — Crear primer administrador\n");

  const username = (await ask("Username del admin: ")).trim();
  const email = (await ask("Email del admin: ")).trim();
  const password = (await ask("Contraseña del admin: ")).trim();

  if (!username || !email || !password) {
    console.error("❌ Todos los campos son obligatorios.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);

  try {
    const result = await query(
      `INSERT INTO users (username, email, password, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE SET role = 'admin', password = $3
       RETURNING id, username, email, role`,
      [username, email, hash]
    );

    const admin = result.rows[0];
    console.log(`\n✅ Admin creado exitosamente:`);
    console.log(`   ID:       ${admin.id}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email:    ${admin.email}`);
    console.log(`   Role:     ${admin.role}\n`);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

seedAdmin();
