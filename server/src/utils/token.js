import crypto from "crypto";
import jwt from "jsonwebtoken";

export const COOKIE_NAME = "flownexa_token";

const UNIT_MS = { s: 1000, m: 60000, h: 3600000, d: 86400000 };

const expiresIn = () => process.env.JWT_EXPIRES_IN || "7d";

const toMs = (value) => {
  const match = /^(\d+)\s*([smhd])$/.exec(String(value).trim());
  return match ? Number(match[1]) * UNIT_MS[match[2]] : 7 * UNIT_MS.d;
};

export const cookieOptions = () => ({
  httpOnly: true,
  secure:
    process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true",
  sameSite: process.env.COOKIE_SAMESITE || "lax",
  path: "/",
});

export const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: expiresIn() });

export const setAuthCookie = (res, userId) =>
  res.cookie(COOKIE_NAME, signToken(userId), {
    ...cookieOptions(),
    maxAge: toMs(expiresIn()),
  });

export const clearAuthCookie = (res) => res.clearCookie(COOKIE_NAME, cookieOptions());

export const hashToken = (raw) => crypto.createHash("sha256").update(raw).digest("hex");

export const createRandomToken = () => {
  const raw = crypto.randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw) };
};
