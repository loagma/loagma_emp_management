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
export const startBreak = async (breakData = null) => {
  const res = await api.post("/api/attendance/start-break/", breakData || {});
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

// GET /api/attendance/break-categories/
export const getBreakCategories = async () => {
  const res = await api.get("/api/attendance/break-categories/");
  return res.data;
};

// POST /api/attendance/break-categories/
export const createBreakCategory = async (categoryData) => {
  const res = await api.post("/api/attendance/break-categories/", categoryData);
  return res.data;
};

// GET /api/attendance/break-history/
export const getBreakHistory = async (params = {}) => {
  const res = await api.get("/api/attendance/break-history/", { params });
  return res.data;
};

// GET /api/attendance/break-statistics/
export const getBreakStatistics = async (params = {}) => {
  const res = await api.get("/api/attendance/break-statistics/", { params });
  return res.data;
};

// GET /api/attendance/active-breaks/
export const getActiveBreaks = async () => {
  const res = await api.get("/api/attendance/active-breaks/");
  return res.data;
};

// GET /api/attendance/notifications/
export const getNotifications = async (params = {}) => {
  const res = await api.get("/api/attendance/notifications/", { params });
  return res.data;
};

// POST /api/attendance/notifications/{id}/mark-read/
export const markNotificationRead = async (notificationId) => {
  const res = await api.post(`/api/attendance/notifications/${notificationId}/mark-read/`);
  return res.data;
};

// POST /api/attendance/notifications/{id}/dismiss/
export const dismissNotification = async (notificationId) => {
  const res = await api.post(`/api/attendance/notifications/${notificationId}/dismiss/`);
  return res.data;
};

// GET /api/attendance/notifications/unread-count/
export const getUnreadNotificationCount = async () => {
  const res = await api.get("/api/attendance/notifications/unread-count/");
  return res.data;
};

// POST /api/attendance/check-exceeded-breaks/
export const checkExceededBreaks = async () => {
  const res = await api.post("/api/attendance/check-exceeded-breaks/");
  return res.data;
};
