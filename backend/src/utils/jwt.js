const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

/**
 * Generate a short-lived access token.
 * @param {{ id: string, username: string, role: string }} payload
 */
function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

/**
 * Generate a long-lived refresh token.
 * @param {{ id: string }} payload
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

/**
 * Verify and decode an access token.
 * @param {string} token
 * @returns {{ id: string, username: string, role: string }}
 */
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

/**
 * Verify and decode a refresh token.
 * @param {string} token
 * @returns {{ id: string }}
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

const REFRESH_COOKIE_NAME = "luniel_refresh";

/**
 * Cookie options for the refresh token (httpOnly, secure in prod).
 */
const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: "/",
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
};
