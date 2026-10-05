const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/api-error");

function getConfiguredApiKeys() {
  const raw = process.env.API_KEYS || "";
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function requireApiKey(req, _res, next) {
  if (String(process.env.DISABLE_AUTH).toLowerCase() === "true") {
    req.apiKey = "local-dev";
    return next();
  }

  // 1. If valid JWT Bearer token is present, authenticate user directly
  const authHeader = req.header("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      req.apiKey = `user-${decoded.id}`;
      return next();
    } catch {
      // Token invalid or expired, continue to check API Key
    }
  }

  // 2. Otherwise require API Key from header or query
  const apiKeyFromHeader = req.header("x-api-key");
  const apiKeyFromQuery = typeof req.query.apiKey === "string" ? req.query.apiKey : "";
  const apiKey = (apiKeyFromHeader || apiKeyFromQuery || "").trim();

  if (!apiKey) {
    return next(new ApiError(401, "Autenticación requerida. Usa un token Bearer o el header X-API-Key"));
  }

  const configuredKeys = getConfiguredApiKeys();
  if (configuredKeys.length > 0 && !configuredKeys.includes(apiKey)) {
    return next(new ApiError(401, "API Key invalida o expirada"));
  }

  req.apiKey = apiKey;
  return next();
}

module.exports = { requireApiKey };

