require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const { connect, disconnect, getMongoUri, mongoose } = require("./index");
const { User, Favorite, WatchProgress } = require("./models");

async function migrate() {
  console.log(`[Migrate] Conectando a ${getMongoUri().replace(/\/\/[^@]*@/, "//***@")}`);
  await connect();

  const models = [User, Favorite, WatchProgress];

  for (const model of models) {
    await model.createCollection();
    await model.syncIndexes();
    const indexes = await model.collection.indexes();
    console.log(`[Migrate] ${model.collection.collectionName}: ${indexes.length} indices`);
  }

  console.log(`[Migrate] Base de datos: ${mongoose.connection.name}`);
  await disconnect();
}

migrate().catch(async (err) => {
  console.error("[Migrate] Error:", err.message);
  await disconnect().catch(() => {});
  process.exit(1);
});
