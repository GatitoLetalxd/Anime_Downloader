const express = require("express");
const bcrypt = require("bcryptjs");
const { User } = require("../db/models");
const { ApiError } = require("../utils/api-error");
const { requireAuth } = require("../middlewares/requireAuth");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} = require("../utils/jwt");

const router = express.Router();

function asyncHandler(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

// ─── POST /api/auth/login ────────────────────────────────────────────────────
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Email y contraseña son requeridos");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      "+password username email role avatar is_banned expires_at"
    );

    if (!user) {
      throw new ApiError(401, "Credenciales inválidas");
    }

    if (user.is_banned) {
      throw new ApiError(403, "Tu cuenta está suspendida. Contacta al administrador.");
    }

    if (user.role !== "admin" && user.expires_at && new Date(user.expires_at) < new Date()) {
      throw new ApiError(403, "Tu acceso ha expirado. Por favor, comunícate con el administrador.");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new ApiError(401, "Credenciales inválidas");
    }

    const userId = user._id.toString();
    const tokenPayload = { id: userId, username: user.username, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken({ id: userId });

    // Update last_seen
    await User.updateOne({ _id: user._id }, { $set: { last_seen: new Date() } });

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: userId,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        expires_at: user.expires_at,
      },
    });
  })
);

// ─── POST /api/auth/refresh ──────────────────────────────────────────────────
router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!token) {
      throw new ApiError(401, "No hay refresh token");
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (_e) {
      throw new ApiError(401, "Refresh token inválido o expirado");
    }

    const user = await User.findById(decoded.id).select(
      "username email role avatar is_banned expires_at"
    );

    if (!user) {
      throw new ApiError(401, "Usuario no encontrado");
    }

    if (user.is_banned) {
      throw new ApiError(403, "Tu cuenta está suspendida.");
    }

    if (user.role !== "admin" && user.expires_at && new Date(user.expires_at) < new Date()) {
      throw new ApiError(403, "Tu acceso ha expirado. Por favor, comunícate con el administrador.");
    }

    const userId = user._id.toString();
    const accessToken = signAccessToken({ id: userId, username: user.username, role: user.role });

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: userId,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        expires_at: user.expires_at,
      },
    });
  })
);

// ─── POST /api/auth/logout ───────────────────────────────────────────────────
router.post("/logout", (_req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
  res.status(200).json({ success: true, message: "Sesión cerrada" });
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
        expires_at: req.user.expires_at,
      },
    });
  })
);

module.exports = router;
