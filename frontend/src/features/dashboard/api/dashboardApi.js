import api from "../../../app/axios";

// GET /api/dashboard/stats/
export const getDashboardStats = async () => {
  const res = await api.get("/api/dashboard/stats/");
  return res.data;
};

// GET /api/dashboard/alerts/
export const getDashboardAlerts = async () => {
  const res = await api.get("/api/dashboard/alerts/");
  return res.data;
};
