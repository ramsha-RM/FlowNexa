import api from "./api.interceptor.js";

export const getJobs = async (params) => (await api.get("/jobs", { params })).data;

export const getMyJobs = async (params) => (await api.get("/jobs/mine", { params })).data;

export const getJob = async (id) => (await api.get(`/jobs/${id}`)).data;

export const createJob = async (payload) => (await api.post("/jobs", payload)).data;

export const updateJob = async (id, payload) => (await api.put(`/jobs/${id}`, payload)).data;

export const deleteJob = async (id) => (await api.delete(`/jobs/${id}`)).data;
