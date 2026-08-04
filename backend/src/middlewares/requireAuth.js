const { verifyAccessToken } = require("../utils/jwt");
const { ApiError } = require("../utils/api-error");
const { User } = require("../db/models");

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

    // Fetch fresh user data (checks is_banned & expires_at in real time)
    const user = await User.findById(decoded.id).select(
      "username email role avatar is_banned expires_at"
    );

    if (!user) {
      return next(new ApiError(401, "Usuario no encontrado"));
    }

    if (user.is_banned) {
      return next(new ApiError(403, "Tu cuenta está suspendida. Contacta al administrador."));
    }

    if (user.role !== "admin" && user.expires_at && new Date(user.expires_at) < new Date()) {
      return next(new ApiError(403, "Tu acceso ha expirado. Por favor, comunícate con el administrador."));
    }

    req.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      is_banned: user.is_banned,
      expires_at: user.expires_at,
    };

    // Update last_seen asynchronously (fire and forget)
    User.updateOne({ _id: user._id }, { $set: { last_seen: new Date() } }).catch(() => {});

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token expirado"));
    }
    return next(new ApiError(401, "Token inválido"));
  }
}

module.exports = { requireAuth };
