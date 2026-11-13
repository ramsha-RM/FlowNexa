import bcrypt from "bcryptjs";
import * as oidc from "openid-client";
import User from "../models/auth.model.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  clearAuthCookie,
  cookieOptions,
  createRandomToken,
  hashToken,
  setAuthCookie,
} from "../utils/token.js";
import { getGoogleConfig } from "../config/google.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/mail.service.js";

const DUMMY_HASH = bcrypt.hashSync("flownexa-dummy-password", 12);
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;

const clientUrl = () => (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim();

const issueVerification = async (user) => {
  const { raw, hash } = createRandomToken();
  user.emailVerifyToken = hash;
  user.emailVerifyExpires = new Date(Date.now() + VERIFY_TTL_MS);
  await user.save({ validateBeforeSave: false });
  await sendVerificationEmail(user, raw);
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, company } = req.body;

  if (await User.exists({ email })) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const isEmployer = role === "employer";

  const user = await User.create({
    name,
    email,
    password,
    role: isEmployer ? "employer" : "candidate",
    company: isEmployer ? company : "",
  });

  issueVerification(user).catch((error) =>
    console.error(`Verification email failed: ${error.message}`),
  );

  setAuthCookie(res, user._id);

  res.status(201).json({
    success: true,
    message: "Account created. Check your inbox to verify your email.",
    user: user.toPublic(),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password +loginAttempts +lockUntil");

  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.lockUntil && user.lockUntil > Date.now()) {
    throw new ApiError(429, "Too many failed attempts. Please try again in 15 minutes");
  }

  if (user.provider !== "local" || !user.password) {
    throw new ApiError(401, "This account uses Google sign-in. Please continue with Google");
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= MAX_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_MS);
      user.loginAttempts = 0;
    }
    await user.save({ validateBeforeSave: false });
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.loginAttempts || user.lockUntil) {
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save({ validateBeforeSave: false });
  }

  setAuthCookie(res, user._id);

  res.status(200).json({
    success: true,
    message: "Signed in successfully",
    user: user.toPublic(),
  });
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ success: true, message: "Signed out" });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user.toPublic() });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, company } = req.body;

  if (req.user.role === "employer" && !String(company || "").trim()) {
    throw new ApiError(400, "Company name is required for employers");
  }

  req.user.name = name;
  if (req.user.role === "employer") {
    req.user.company = company;
  }
  await req.user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated",
    user: req.user.toPublic(),
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  if (user.provider !== "local") {
    throw new ApiError(400, "Your password is managed by Google");
  }

  if (!(await user.matchPassword(oldPassword))) {
    throw new ApiError(400, "Current password is incorrect");
  }

  if (oldPassword === newPassword) {
    throw new ApiError(400, "New password must be different from the current password");
  }

  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();

  setAuthCookie(res, user._id);

  res.status(200).json({ success: true, message: "Password updated successfully" });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email, provider: "local" });

  if (user) {
    const { raw, hash } = createRandomToken();
    user.passwordResetToken = hash;
    user.passwordResetExpires = new Date(Date.now() + RESET_TTL_MS);
    await user.save({ validateBeforeSave: false });
    sendPasswordResetEmail(user, raw).catch((error) =>
      console.error(`Reset email failed: ${error.message}`),
    );
  }

  res.status(200).json({
    success: true,
    message: "If an account exists for that email, a reset link has been sent.",
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    passwordResetToken: hashToken(req.body.token),
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    throw new ApiError(400, "This reset link is invalid or has expired");
  }

  user.password = req.body.password;
  user.passwordChangedAt = new Date();
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  clearAuthCookie(res);

  res.status(200).json({
    success: true,
    message: "Password reset successfully. You can now sign in.",
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    emailVerifyToken: hashToken(req.body.token),
    emailVerifyExpires: { $gt: new Date() },
  }).select("+emailVerifyToken +emailVerifyExpires");

  if (!user) {
    throw new ApiError(400, "This verification link is invalid or has expired");
  }

  user.isEmailVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: "Email verified successfully" });
});

export const resendVerification = asyncHandler(async (req, res) => {
  if (req.user.isEmailVerified) {
    throw new ApiError(400, "Your email is already verified");
  }

  await issueVerification(req.user);

  res.status(200).json({ success: true, message: "Verification email sent" });
});

const GOOGLE_COOKIE_MAX_AGE = 10 * 60 * 1000;

const googleCookieOptions = () => ({
  ...cookieOptions(),
  sameSite: "lax",
  maxAge: GOOGLE_COOKIE_MAX_AGE,
});

const clearGoogleCookies = (res) => {
  const { maxAge, ...options } = googleCookieOptions();
  ["google_code_verifier", "google_state", "google_role"].forEach((name) =>
    res.clearCookie(name, options),
  );
};

const redirectWithError = (res, message) => {
  clearGoogleCookies(res);
  return res.redirect(`${clientUrl()}/login?error=${encodeURIComponent(message)}`);
};

export const googleLogin = asyncHandler(async (req, res) => {
  const config = await getGoogleConfig();

  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
  const state = oidc.randomState();
  const role = req.query.role === "employer" ? "employer" : "candidate";

  res.cookie("google_code_verifier", codeVerifier, googleCookieOptions());
  res.cookie("google_state", state, googleCookieOptions());
  res.cookie("google_role", role, googleCookieOptions());

  const redirectUrl = oidc.buildAuthorizationUrl(config, {
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    scope: "openid email profile",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });

  res.redirect(redirectUrl.href);
});

export const googleCallback = async (req, res) => {
  try {
    const codeVerifier = req.cookies?.google_code_verifier;
    const expectedState = req.cookies?.google_state;
    const role = req.cookies?.google_role === "employer" ? "employer" : "candidate";

    if (!codeVerifier || !expectedState) {
      return redirectWithError(res, "Google sign-in session expired. Please try again");
    }

    const config = await getGoogleConfig();
    const currentUrl = new URL(`${process.env.GOOGLE_REDIRECT_URI}?${new URLSearchParams(
      Object.fromEntries(
        Object.entries(req.query).filter(([, value]) => typeof value === "string"),
      ),
    )}`);

    const tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedState,
    });

    const claims = tokens.claims();

    if (!claims?.sub || !claims?.email || claims.email_verified !== true) {
      return redirectWithError(res, "Your Google account email could not be verified");
    }

    const email = String(claims.email).toLowerCase();
    let user = await User.findOne({ email });

    if (user && user.provider === "local") {
      return redirectWithError(
        res,
        "This email is registered with a password. Please sign in with your password",
      );
    }

    if (!user) {
      user = await User.create({
        name: String(claims.name || email.split("@")[0]).slice(0, 60),
        email,
        provider: "google",
        googleId: claims.sub,
        profilePicture: typeof claims.picture === "string" ? claims.picture : "",
        isEmailVerified: true,
        role,
      });
    } else if (user.googleId && user.googleId !== claims.sub) {
      return redirectWithError(res, "Google account mismatch. Please contact support");
    } else if (!user.googleId) {
      user.googleId = claims.sub;
      await user.save({ validateBeforeSave: false });
    }

    clearGoogleCookies(res);
    setAuthCookie(res, user._id);

    return res.redirect(`${clientUrl()}/oauth-success`);
  } catch (error) {
    console.error(`Google sign-in failed: ${error.message}`);
    return redirectWithError(res, "Google sign-in failed. Please try again");
  }
};
