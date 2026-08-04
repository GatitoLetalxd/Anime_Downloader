require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const { connect, disconnect, mongoose } = require("./index");
const { User, Favorite, WatchProgress } = require("./models");
const pg = require("./postgres");

const uuidToObjectId = new Map();

function mapUserId(uuid) {
  if (!uuidToObjectId.has(uuid)) {
    uuidToObjectId.set(uuid, new mongoose.Types.ObjectId());
  }
  return uuidToObjectId.get(uuid);
}

async function migrateUsers() {
  const { rows } = await pg.query(
    `SELECT id, username, email, password, role, avatar, is_banned, banned_at,
            created_at, last_seen, expires_at
     FROM users ORDER BY created_at`
  );

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const exists = await User.exists({ email: row.email });
    if (exists) {
      uuidToObjectId.set(row.id, exists._id);
      skipped += 1;
      continue;
    }

    const doc = await User.create({
      _id: mapUserId(row.id),
      username: row.username,
      email: row.email,
      password: row.password,
      role: row.role,
      avatar: row.avatar,
      is_banned: row.is_banned,
      banned_at: row.banned_at,
      created_at: row.created_at,
      last_seen: row.last_seen,
      expires_at: row.expires_at,
    });

    uuidToObjectId.set(row.id, doc._id);
    inserted += 1;
  }

  console.log(`[Data] users: ${inserted} insertados, ${skipped} ya existian`);
}

async function migrateFavorites() {
  const { rows } = await pg.query(
    `SELECT user_id, anime_url, anime_title, anime_cover, provider, added_at
     FROM favorites ORDER BY added_at`
  );

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const userId = uuidToObjectId.get(row.user_id);
    if (!userId) {
      skipped += 1;
      continue;
    }

    const result = await Favorite.updateOne(
      { user_id: userId, anime_url: row.anime_url },
      {
        $setOnInsert: {
          user_id: userId,
          anime_url: row.anime_url,
          anime_title: row.anime_title,
          anime_cover: row.anime_cover,
          provider: row.provider,
          added_at: row.added_at,
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) inserted += 1;
    else skipped += 1;
  }

  console.log(`[Data] favorites: ${inserted} insertados, ${skipped} omitidos`);
}

async function migrateWatchProgress() {
  const { rows } = await pg.query(
    `SELECT user_id, anime_url, anime_title, anime_cover, provider,
            episode_num, episode_url, updated_at
     FROM watch_progress ORDER BY updated_at`
  );

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const userId = uuidToObjectId.get(row.user_id);
    if (!userId) {
      skipped += 1;
      continue;
    }

    const result = await WatchProgress.updateOne(
      { user_id: userId, anime_url: row.anime_url },
      {
        $setOnInsert: {
          user_id: userId,
          anime_url: row.anime_url,
          anime_title: row.anime_title,
          anime_cover: row.anime_cover,
          provider: row.provider,
          episode_num: row.episode_num,
          episode_url: row.episode_url,
          updated_at: row.updated_at,
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) inserted += 1;
    else skipped += 1;
  }

  console.log(`[Data] watch_progress: ${inserted} insertados, ${skipped} omitidos`);
}

async function run() {
  await connect();

  for (const model of [User, Favorite, WatchProgress]) {
    await model.createCollection();
    await model.syncIndexes();
  }

  await migrateUsers();
  await migrateFavorites();
  await migrateWatchProgress();

  await pg.pool.end();
  await disconnect();
}

run().catch(async (err) => {
  console.error("[Data] Error:", err.message);
  await pg.pool.end().catch(() => {});
  await disconnect().catch(() => {});
  process.exit(1);
});
