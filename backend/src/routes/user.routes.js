const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { ApiError } = require("../utils/api-error");
const { requireAuth } = require("../middlewares/requireAuth");

const router = express.Router();

function asyncHandler(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

// All user routes require authentication
router.use(requireAuth);

// ─── GET /api/user/favorites ─────────────────────────────────────────────────
router.get(
  "/favorites",
  asyncHandler(async (req, res) => {
    const result = await db.query(
      "SELECT id, anime_url, anime_title, anime_cover, provider, added_at FROM favorites WHERE user_id = $1 ORDER BY added_at DESC",
      [req.user.id]
    );
    res.status(200).json({ success: true, data: result.rows });
  })
);

// ─── POST /api/user/favorites ────────────────────────────────────────────────
router.post(
  "/favorites",
  asyncHandler(async (req, res) => {
    const { anime_url, anime_title, anime_cover, provider } = req.body;

    if (!anime_url || !anime_title) {
      throw new ApiError(400, "anime_url y anime_title son requeridos");
    }

    const result = await db.query(
      `INSERT INTO favorites (user_id, anime_url, anime_title, anime_cover, provider)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, anime_url) DO NOTHING
       RETURNING *`,
      [req.user.id, anime_url, anime_title, anime_cover || null, provider || null]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ success: true, message: "Ya estaba en favoritos" });
    }

    res.status(201).json({ success: true, data: result.rows[0] });
  })
);

// ─── DELETE /api/user/favorites ──────────────────────────────────────────────
router.delete(
  "/favorites",
  asyncHandler(async (req, res) => {
    const { anime_url } = req.body;

    if (!anime_url) {
      throw new ApiError(400, "anime_url es requerido");
    }

    await db.query(
      "DELETE FROM favorites WHERE user_id = $1 AND anime_url = $2",
      [req.user.id, anime_url]
    );

    res.status(200).json({ success: true, message: "Eliminado de favoritos" });
  })
);

// ─── GET /api/user/progress ──────────────────────────────────────────────────
router.get(
  "/progress",
  asyncHandler(async (req, res) => {
    const result = await db.query(
      `SELECT id, anime_url, anime_title, anime_cover, provider, episode_num, episode_url, updated_at
       FROM watch_progress WHERE user_id = $1 ORDER BY updated_at DESC`,
      [req.user.id]
    );
    res.status(200).json({ success: true, data: result.rows });
  })
);

// ─── POST /api/user/progress ─────────────────────────────────────────────────
router.post(
  "/progress",
  asyncHandler(async (req, res) => {
    const { anime_url, anime_title, anime_cover, provider, episode_num, episode_url } = req.body;

    if (!anime_url || !anime_title || episode_num === undefined || !episode_url) {
      throw new ApiError(400, "anime_url, anime_title, episode_num y episode_url son requeridos");
    }

    const result = await db.query(
      `INSERT INTO watch_progress (user_id, anime_url, anime_title, anime_cover, provider, episode_num, episode_url, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (user_id, anime_url) DO UPDATE
         SET episode_num = EXCLUDED.episode_num,
             episode_url = EXCLUDED.episode_url,
             anime_cover = EXCLUDED.anime_cover,
             provider    = EXCLUDED.provider,
             updated_at  = NOW()
       RETURNING *`,
      [req.user.id, anime_url, anime_title, anime_cover || null, provider || null, episode_num, episode_url]
    );

    res.status(200).json({ success: true, data: result.rows[0] });
  })
);

// ─── DELETE /api/user/progress ───────────────────────────────────────────────
router.delete(
  "/progress",
  asyncHandler(async (req, res) => {
    const { anime_url } = req.body;

    if (!anime_url) {
      throw new ApiError(400, "anime_url es requerido");
    }

    await db.query(
      "DELETE FROM watch_progress WHERE user_id = $1 AND anime_url = $2",
      [req.user.id, anime_url]
    );

    res.status(200).json({ success: true, message: "Progreso eliminado" });
  })
);

// ─── PATCH /api/user/profile ─────────────────────────────────────────────────
router.patch(
  "/profile",
  asyncHandler(async (req, res) => {
    const { avatar } = req.body;

    if (!avatar) {
      throw new ApiError(400, "avatar es requerido");
    }

    // Basic validation: must match pattern avatar_XX.png or avatarXX.png
    if (!/^avatar_?\d+\.png$/.test(avatar)) {
      throw new ApiError(400, "Nombre de avatar inválido");
    }

    const result = await db.query(
      "UPDATE users SET avatar = $1 WHERE id = $2 RETURNING id, username, email, role, avatar",
      [avatar, req.user.id]
    );

    res.status(200).json({ success: true, user: result.rows[0] });
  })
);

// ─── PATCH /api/user/password ─────────────────────────────────────────────────
router.patch(
  "/password",
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new ApiError(400, "Todos los campos son requeridos");
    }

    if (newPassword !== confirmPassword) {
      throw new ApiError(400, "Las nuevas contraseñas no coinciden");
    }

    if (newPassword.length < 6) {
      throw new ApiError(400, "La nueva contraseña debe tener al menos 6 caracteres");
    }

    // Fetch current hashed password
    const result = await db.query(
      "SELECT password FROM users WHERE id = $1",
      [req.user.id]
    );

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      throw new ApiError(401, "La contraseña actual es incorrecta");
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await db.query("UPDATE users SET password = $1 WHERE id = $2", [hashed, req.user.id]);

    res.status(200).json({ success: true, message: "Contraseña actualizada correctamente" });
  })
);

module.exports = router;
