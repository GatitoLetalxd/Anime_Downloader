require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const readline = require("readline");
const bcrypt = require("bcryptjs");
const { connect, disconnect } = require("./index");
const { User } = require("./models");

let rl = null;

function ask(question) {
  if (!rl) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  }
  return new Promise((resolve) => rl.question(question, resolve));
}

function closePrompt() {
  if (rl) rl.close();
}

async function seedAdmin() {
  const [argUsername, argEmail, argPassword] = process.argv.slice(2);

  const username = (argUsername || (await ask("Username del admin: "))).trim();
  const email = (argEmail || (await ask("Email del admin: "))).trim().toLowerCase();
  const password = (argPassword || (await ask("Contraseña del admin: "))).trim();

  if (!username || !email || !password) {
    console.error("Todos los campos son obligatorios.");
    console.error("Uso: node src/db/seed-admin.js [username] [email] [password]");
    closePrompt();
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);

  try {
    await connect();

    const admin = await User.findOneAndUpdate(
      { email },
      {
        $set: { role: "admin", password: hash },
        $setOnInsert: { username, email, created_at: new Date() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`ID:       ${admin._id}`);
    console.log(`Username: ${admin.username}`);
    console.log(`Email:    ${admin.email}`);
    console.log(`Role:     ${admin.role}`);
  } catch (err) {
    console.error("Error:", err.message);
    closePrompt();
    await disconnect().catch(() => {});
    process.exit(1);
  } finally {
    closePrompt();
    await disconnect().catch(() => {});
  }
}

seedAdmin();
