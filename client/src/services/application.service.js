import api from "./api.interceptor.js";

export const applyToJob = async (jobId, formData) =>
  (
    await api.post(`/applications/apply/${jobId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  ).data;

export const getMyApplications = async (params) =>
  (await api.get("/applications/my-applications", { params })).data;

export const getJobApplicants = async (jobId, params) =>
  (await api.get(`/applications/job/${jobId}`, { params })).data;

export const updateApplicationStatus = async (id, status) =>
  (await api.put(`/applications/${id}/status`, { status })).data;

export const deleteApplication = async (id) => (await api.delete(`/applications/${id}`)).data;
