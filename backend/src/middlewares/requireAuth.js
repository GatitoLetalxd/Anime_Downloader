const { verifyAccessToken } = require("../utils/jwt");
const { ApiError } = require("../utils/api-error");
const db = require("../db");

/**
 * Middleware that verifies the JWT access token and attaches req.user.
 * Expects: Authorization: Bearer <accessToken>
 */
async function requireAuth(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "Se requiere autenticación"));
    }

    const token = authHeader.slice(7);
    const decoded = verifyAccessToken(token);

    // Fetch fresh user data (checks is_banned in real time)
    const result = await db.query(
      "SELECT id, username, email, role, avatar, is_banned FROM users WHERE id = $1",
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return next(new ApiError(401, "Usuario no encontrado"));
    }

    const user = result.rows[0];

    if (user.is_banned) {
      return next(new ApiError(403, "Tu cuenta está suspendida. Contacta al administrador."));
    }

    req.user = user;

    // Update last_seen asynchronously (fire and forget)
    db.query("UPDATE users SET last_seen = NOW() WHERE id = $1", [user.id]).catch(() => {});

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token expirado"));
    }
    return next(new ApiError(401, "Token inválido"));
  }
}

module.exports = { requireAuth };
