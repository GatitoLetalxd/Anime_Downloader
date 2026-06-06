const { ApiError } = require("../utils/api-error");

/**
 * Middleware that restricts access to admin users only.
 * Must be used AFTER requireAuth.
 */
function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== "admin") {
    return next(new ApiError(403, "Acceso denegado. Se requieren permisos de administrador."));
  }
  next();
}

module.exports = { requireAdmin };
