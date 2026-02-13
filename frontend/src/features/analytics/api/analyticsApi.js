import api from "../../../app/axios";

// GET /api/analytics/summary/
export const getAnalyticsSummary = async () => {
  const res = await api.get("/api/analytics/summary/");
  return res.data;
};

// GET /api/analytics/trends/
export const getAnalyticsTrends = async (period = "30d") => {
  const res = await api.get("/api/analytics/trends/", {
    params: { period },
  });
  return res.data;
};
