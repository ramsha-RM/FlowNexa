import api from "./api.interceptor.js";
import { API_BASE_URL } from "../config.js";

export const register = async (payload) => (await api.post("/auth/register", payload)).data;

export const login = async (email, password) =>
  (await api.post("/auth/login", { email, password })).data;

export const logout = async () => (await api.post("/auth/logout")).data;

export const profile = async () => (await api.get("/auth/me")).data;

export const updateProfile = async (payload) => (await api.put("/auth/profile", payload)).data;

export const changePassword = async (oldPassword, newPassword) =>
  (await api.put("/auth/change-password", { oldPassword, newPassword })).data;

export const forgotPassword = async (email) =>
  (await api.post("/auth/forgot-password", { email })).data;

export const resetPassword = async (token, password) =>
  (await api.post("/auth/reset-password", { token, password })).data;

export const verifyEmail = async (token) => (await api.post("/auth/verify-email", { token })).data;

export const resendVerification = async () => (await api.post("/auth/resend-verification")).data;

export const googleLoginUrl = (role = "candidate") =>
  `${API_BASE_URL}/auth/google-login?role=${encodeURIComponent(role)}`;
