const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
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

    const result = await db.query(
      "SELECT id, username, email, password, role, avatar, is_banned, expires_at FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      throw new ApiError(401, "Credenciales inválidas");
    }

    const user = result.rows[0];

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

    const tokenPayload = { id: user.id, username: user.username, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken({ id: user.id });

    // Update last_seen
    await db.query("UPDATE users SET last_seen = NOW() WHERE id = $1", [user.id]);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user.id,
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

    const result = await db.query(
      "SELECT id, username, email, role, avatar, is_banned, expires_at FROM users WHERE id = $1",
      [decoded.id]
    );

    if (result.rows.length === 0) {
      throw new ApiError(401, "Usuario no encontrado");
    }

    const user = result.rows[0];

    if (user.is_banned) {
      throw new ApiError(403, "Tu cuenta está suspendida.");
    }

    if (user.role !== "admin" && user.expires_at && new Date(user.expires_at) < new Date()) {
      throw new ApiError(403, "Tu acceso ha expirado. Por favor, comunícate con el administrador.");
    }

    const accessToken = signAccessToken({ id: user.id, username: user.username, role: user.role });

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user.id,
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
