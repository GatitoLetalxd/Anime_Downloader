const express = require("express");
const bcrypt = require("bcryptjs");
const { User, Favorite, WatchProgress } = require("../db/models");
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
    const favorites = await Favorite.find({ user_id: req.user.id }).sort({ added_at: -1 });
    res.status(200).json({ success: true, data: favorites.map((doc) => doc.toJSON()) });
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

    const existing = await Favorite.findOne({ user_id: req.user.id, anime_url });

    if (existing) {
      return res.status(200).json({ success: true, message: "Ya estaba en favoritos" });
    }

    const favorite = await Favorite.create({
      user_id: req.user.id,
      anime_url,
      anime_title,
      anime_cover: anime_cover || null,
      provider: provider || null,
    });

    res.status(201).json({ success: true, data: favorite.toJSON() });
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

    await Favorite.deleteOne({ user_id: req.user.id, anime_url });

    res.status(200).json({ success: true, message: "Eliminado de favoritos" });
  })
);

// ─── GET /api/user/progress ──────────────────────────────────────────────────
router.get(
  "/progress",
  asyncHandler(async (req, res) => {
    const progress = await WatchProgress.find({ user_id: req.user.id }).sort({ updated_at: -1 });
    res.status(200).json({ success: true, data: progress.map((doc) => doc.toJSON()) });
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

    const entry = await WatchProgress.findOneAndUpdate(
      { user_id: req.user.id, anime_url },
      {
        $set: {
          anime_title,
          anime_cover: anime_cover || null,
          provider: provider || null,
          episode_num,
          episode_url,
          updated_at: new Date(),
        },
        $setOnInsert: { user_id: req.user.id, anime_url },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, data: entry.toJSON() });
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

    await WatchProgress.deleteOne({ user_id: req.user.id, anime_url });

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

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { avatar } },
      { new: true }
    ).select("username email role avatar");

    res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
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
    const user = await User.findById(req.user.id).select("+password");
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      throw new ApiError(401, "La contraseña actual es incorrecta");
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.updateOne({ _id: req.user.id }, { $set: { password: hashed } });

    res.status(200).json({ success: true, message: "Contraseña actualizada correctamente" });
  })
);

module.exports = router;
