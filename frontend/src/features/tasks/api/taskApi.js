import api from "../../../app/axios";

// GET /api/tasks/
export const fetchTasks = async (params = {}) => {
  const res = await api.get("/api/tasks/", { params });
  return res.data;
};

// POST /api/tasks/
export const createTask = async (data) => {
  const res = await api.post("/api/tasks/", data);
  return res.data;
};

// GET /api/tasks/{id}/
export const getTask = async (id) => {
  const res = await api.get(`/api/tasks/${id}/`);
  return res.data;
};

// PUT /api/tasks/{id}/
export const updateTask = async (id, data) => {
  const res = await api.put(`/api/tasks/${id}/`, data);
  return res.data;
};

// PATCH /api/tasks/{id}/
export const partialUpdateTask = async (id, data) => {
  const res = await api.patch(`/api/tasks/${id}/`, data);
  return res.data;
};

// DELETE /api/tasks/{id}/
export const deleteTask = async (id) => {
  const res = await api.delete(`/api/tasks/${id}/`);
  return res.data;
};

// PATCH /api/tasks/{id}/status/
export const updateTaskStatus = async (id, status) => {
  const res = await api.patch(`/api/tasks/${id}/status/`, { status });
  return res.data;
};
