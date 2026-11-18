import api from "./api.interceptor.js";

export const getStats = async () => (await api.get("/admin/stats")).data;

export const getUsers = async (params) => (await api.get("/admin/users", { params })).data;

export const updateUserRole = async (id, role) =>
  (await api.put(`/admin/users/${id}/role`, { role })).data;

export const deleteUser = async (id) => (await api.delete(`/admin/users/${id}`)).data;

export const getAdminApplications = async (params) =>
  (await api.get("/admin/applications", { params })).data;
