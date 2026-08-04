const express = require("express");
const bcrypt = require("bcryptjs");
const { User, Favorite, WatchProgress } = require("../db/models");
const { ApiError } = require("../utils/api-error");
const { requireAuth } = require("../middlewares/requireAuth");
const { requireAdmin } = require("../middlewares/requireAdmin");

const router = express.Router();

function asyncHandler(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function serializeUser(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    is_banned: user.is_banned,
    created_at: user.created_at,
    last_seen: user.last_seen,
    expires_at: user.expires_at,
  };
}

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

// ─── GET /api/admin/stats ────────────────────────────────────────────────────
router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [stats] = await User.aggregate([
      { $match: { role: "user" } },
      {
        $group: {
          _id: null,
          total_users: { $sum: 1 },
          new_today: { $sum: { $cond: [{ $gte: ["$created_at", oneDayAgo] }, 1, 0] } },
          new_this_week: { $sum: { $cond: [{ $gte: ["$created_at", sevenDaysAgo] }, 1, 0] } },
          active_last_week: { $sum: { $cond: [{ $gte: ["$last_seen", sevenDaysAgo] }, 1, 0] } },
          total_banned: { $sum: { $cond: ["$is_banned", 1, 0] } },
        },
      },
      { $project: { _id: 0 } },
    ]);

    const emptyStats = {
      total_users: 0,
      new_today: 0,
      new_this_week: 0,
      active_last_week: 0,
      total_banned: 0,
    };

    // Favorites and progress counts
    const totalFavorites = await Favorite.countDocuments();
    const totalProgress = await WatchProgress.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        ...(stats || emptyStats),
        total_favorites: totalFavorites,
        total_progress_entries: totalProgress,
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
    const skip = (page - 1) * limit;
    const filter = req.query.filter; // 'banned' | 'admin' | undefined
    const search = req.query.search;

    const conditions = {};

    if (filter === "banned") {
      conditions.is_banned = true;
    } else if (filter === "admin") {
      conditions.role = "admin";
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      conditions.$or = [{ username: regex }, { email: regex }];
    }

    const total = await User.countDocuments(conditions);

    const users = await User.find(conditions)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        users: users.map(serializeUser),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  })
);

// ─── POST /api/admin/users — Create new user ─────────────────────────────────
router.post(
  "/users",
  asyncHandler(async (req, res) => {
    const { username, email, password, role = "user", durationDays } = req.body;

    if (!username || !email || !password) {
      throw new ApiError(400, "username, email y password son requeridos");
    }

    if (!["user", "admin"].includes(role)) {
      throw new ApiError(400, "Rol inválido. Debe ser 'user' o 'admin'");
    }

    const hash = await bcrypt.hash(password, 12);
    let expires_at = null;

    if (role === "user" && durationDays && parseInt(durationDays) > 0) {
      expires_at = new Date(Date.now() + parseInt(durationDays) * 24 * 60 * 60 * 1000);
    }

    try {
      const user = await User.create({
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password: hash,
        role,
        expires_at,
      });

      res.status(201).json({
        success: true,
        data: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          expires_at: user.expires_at,
          created_at: user.created_at,
        },
      });
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key violation
        const field = Object.keys(err.keyPattern || {})[0];
        if (field === "email") {
          throw new ApiError(409, "El email ya está en uso");
        }
        if (field === "username") {
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

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { is_banned: true, banned_at: new Date() } },
      { new: true }
    );

    if (!user) {
      throw new ApiError(404, "Usuario no encontrado");
    }

    res.status(200).json({
      success: true,
      data: { id: user._id.toString(), username: user.username, is_banned: user.is_banned },
      message: "Usuario suspendido",
    });
  })
);

// ─── PATCH /api/admin/users/:id/unban ────────────────────────────────────────
router.patch(
  "/users/:id/unban",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { is_banned: false, banned_at: null } },
      { new: true }
    );

    if (!user) {
      throw new ApiError(404, "Usuario no encontrado");
    }

    res.status(200).json({
      success: true,
      data: { id: user._id.toString(), username: user.username, is_banned: user.is_banned },
      message: "Usuario reactivado",
    });
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

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      throw new ApiError(404, "Usuario no encontrado");
    }

    // Cascade delete (replaces ON DELETE CASCADE from PostgreSQL)
    await Favorite.deleteMany({ user_id: user._id });
    await WatchProgress.deleteMany({ user_id: user._id });

    res.status(200).json({
      success: true,
      message: `Usuario '${user.username}' eliminado permanentemente`,
    });
  })
);

// ─── PATCH /api/admin/users/:id — Edit user details ──────────────────────────
router.patch(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { username, email, password, role, expires_at } = req.body;

    const userCheck = await User.findById(id).select("role");
    if (!userCheck) {
      throw new ApiError(404, "Usuario no encontrado");
    }

    const updates = {};

    if (username !== undefined) {
      updates.username = username.trim();
    }
    if (email !== undefined) {
      updates.email = email.toLowerCase().trim();
    }
    if (role !== undefined) {
      updates.role = role;
    }
    if (password && password.trim().length > 0) {
      updates.password = await bcrypt.hash(password, 12);
    }
    if (expires_at !== undefined) {
      updates.expires_at = expires_at ? new Date(expires_at) : null;
    }

    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, "No se enviaron campos para actualizar");
    }

    try {
      const user = await User.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        data: serializeUser(user),
        message: "Usuario actualizado con éxito",
      });
    } catch (err) {
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0];
        if (field === "email") {
          throw new ApiError(409, "El email ya está en uso");
        }
        if (field === "username") {
          throw new ApiError(409, "El username ya está en uso");
        }
      }
      throw err;
    }
  })
);

module.exports = router;
