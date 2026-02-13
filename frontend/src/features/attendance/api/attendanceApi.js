import api from "../../../app/axios";

// GET /api/attendance/current/
export const getCurrentAttendance = async () => {
  const res = await api.get("/api/attendance/current/");
  return res.data;
};

// POST /api/attendance/punch-in/
export const punchIn = async () => {
  const res = await api.post("/api/attendance/punch-in/");
  return res.data;
};

// POST /api/attendance/punch-out/
export const punchOut = async () => {
  const res = await api.post("/api/attendance/punch-out/");
  return res.data;
};

// POST /api/attendance/start-break/
export const startBreak = async () => {
  const res = await api.post("/api/attendance/start-break/");
  return res.data;
};

// POST /api/attendance/end-break/
export const endBreak = async () => {
  const res = await api.post("/api/attendance/end-break/");
  return res.data;
};

// GET /api/attendance/
export const getAttendanceList = async (params = {}) => {
  const res = await api.get("/api/attendance/", { params });
  return res.data;
};
