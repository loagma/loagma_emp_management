import api from "../../../app/axios";

// POST /auth/login/
export const login = async (credentials) => {
  const res = await api.post("/auth/login/", credentials);
  return res.data;
};

// POST /auth/refresh/
export const refreshToken = async (refreshToken) => {
  const res = await api.post("/auth/refresh/", { refresh: refreshToken });
  return res.data;
};

// GET /auth/me/
export const getCurrentUser = async () => {
  const res = await api.get("/auth/me/");
  return res.data;
};
