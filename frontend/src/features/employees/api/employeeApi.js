import api from "../../../app/axios";

// GET /api/employees/
export const fetchEmployees = async (params = {}) => {
  const res = await api.get("/api/employees/", { params });
  return res.data;
};

// GET /api/employees/{id}/
export const getEmployee = async (id) => {
  const res = await api.get(`/api/employees/${id}/`);
  return res.data;
};

// POST /api/employees/
export const createEmployee = async (employeeData) => {
  const res = await api.post("/api/employees/", employeeData);
  return res.data;
};

// PUT /api/employees/{id}/
export const updateEmployee = async (id, employeeData) => {
  const res = await api.put(`/api/employees/${id}/`, employeeData);
  return res.data;
};

// PATCH /api/employees/{id}/toggle-active/
export const toggleEmployeeActive = async (id) => {
  const res = await api.patch(`/api/employees/${id}/toggle-active/`);
  return res.data;
};

// DELETE /api/employees/{id}/
export const deleteEmployee = async (id) => {
  const res = await api.delete(`/api/employees/${id}/`);
  return res.data;
};
