const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { ApiError } = require("../utils/api-error");
const { requireAuth } = require("../middlewares/requireAuth");
const { requireAdmin } = require("../middlewares/requireAdmin");

const router = express.Router();

function asyncHandler(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

// ─── GET /api/admin/stats ────────────────────────────────────────────────────
router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const statsQuery = `
      SELECT
        COUNT(*)                                                         AS total_users,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') AS new_today,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS new_this_week,
        COUNT(*) FILTER (WHERE last_seen  >= NOW() - INTERVAL '7 days') AS active_last_week,
        COUNT(*) FILTER (WHERE is_banned = TRUE)                        AS total_banned
      FROM users
      WHERE role = 'user'
    `;
    const result = await db.query(statsQuery);

    // Favorites and progress counts
    const favCount = await db.query("SELECT COUNT(*) AS total FROM favorites");
    const progCount = await db.query("SELECT COUNT(*) AS total FROM watch_progress");

    res.status(200).json({
      success: true,
      data: {
        ...result.rows[0],
        total_favorites: favCount.rows[0].total,
        total_progress_entries: progCount.rows[0].total,
      },
    });
  })
);

// ─── GET /api/admin/users ────────────────────────────────────────────────────
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const filter = req.query.filter; // 'banned' | 'admin' | undefined

    let whereClause = "";
    const params = [limit, offset];

    if (filter === "banned") {
      whereClause = "WHERE is_banned = TRUE";
    } else if (filter === "admin") {
      whereClause = "WHERE role = 'admin'";
    }

    const countResult = await db.query(`SELECT COUNT(*) AS total FROM users ${whereClause}`);
    const usersResult = await db.query(
      `SELECT id, username, email, role, avatar, is_banned, created_at, last_seen
       FROM users ${whereClause}
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );

    res.status(200).json({
      success: true,
      data: {
        users: usersResult.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          page,
          limit,
          pages: Math.ceil(countResult.rows[0].total / limit),
        },
      },
    });
  })
);

// ─── POST /api/admin/users — Create new user ─────────────────────────────────
router.post(
  "/users",
  asyncHandler(async (req, res) => {
    const { username, email, password, role = "user" } = req.body;

    if (!username || !email || !password) {
      throw new ApiError(400, "username, email y password son requeridos");
    }

    if (!["user", "admin"].includes(role)) {
      throw new ApiError(400, "Rol inválido. Debe ser 'user' o 'admin'");
    }

    const hash = await bcrypt.hash(password, 12);

    try {
      const result = await db.query(
        `INSERT INTO users (username, email, password, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, username, email, role, avatar, created_at`,
        [username.trim(), email.toLowerCase().trim(), hash, role]
      );

      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      if (err.code === "23505") {
        // Unique constraint violation
        if (err.constraint?.includes("email")) {
          throw new ApiError(409, "El email ya está en uso");
        }
        if (err.constraint?.includes("username")) {
          throw new ApiError(409, "El username ya está en uso");
        }
      }
      throw err;
    }
  })
);

// ─── PATCH /api/admin/users/:id/ban ──────────────────────────────────────────
router.patch(
  "/users/:id/ban",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (id === req.user.id) {
      throw new ApiError(400, "No puedes suspender tu propia cuenta");
    }

    const result = await db.query(
      "UPDATE users SET is_banned = TRUE, banned_at = NOW() WHERE id = $1 RETURNING id, username, is_banned",
      [id]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, "Usuario no encontrado");
    }

    res.status(200).json({ success: true, data: result.rows[0], message: "Usuario suspendido" });
  })
);

// ─── PATCH /api/admin/users/:id/unban ────────────────────────────────────────
router.patch(
  "/users/:id/unban",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await db.query(
      "UPDATE users SET is_banned = FALSE, banned_at = NULL WHERE id = $1 RETURNING id, username, is_banned",
      [id]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, "Usuario no encontrado");
    }

    res.status(200).json({ success: true, data: result.rows[0], message: "Usuario reactivado" });
  })
);

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────
router.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (id === req.user.id) {
      throw new ApiError(400, "No puedes eliminar tu propia cuenta");
    }

    const result = await db.query(
      "DELETE FROM users WHERE id = $1 RETURNING id, username",
      [id]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, "Usuario no encontrado");
    }

    res.status(200).json({
      success: true,
      message: `Usuario '${result.rows[0].username}' eliminado permanentemente`,
    });
  })
);

module.exports = router;
