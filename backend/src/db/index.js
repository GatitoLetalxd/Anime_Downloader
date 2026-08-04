const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

function getMongoUri() {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;

  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT) || 27017;
  const name = process.env.DB_NAME || "lunielanime";
  const user = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;

  if (user && password) {
    const credentials = `${encodeURIComponent(user)}:${encodeURIComponent(password)}`;
    const authSource = process.env.DB_AUTH_SOURCE || "admin";
    return `mongodb://${credentials}@${host}:${port}/${name}?authSource=${authSource}`;
  }

  return `mongodb://${host}:${port}/${name}`;
}

async function connect() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  await mongoose.connect(getMongoUri(), {
    serverSelectionTimeoutMS: Number(process.env.DB_TIMEOUT_MS) || 10000,
    maxPoolSize: Number(process.env.DB_POOL_SIZE) || 10,
  });

  return mongoose.connection;
}

async function disconnect() {
  await mongoose.disconnect();
}

mongoose.connection.on("error", (err) => {
  console.error("[DB] MongoDB connection error", err);
});

module.exports = { connect, disconnect, getMongoUri, mongoose };
