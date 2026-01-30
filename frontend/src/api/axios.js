import axios from "axios";
import { getToken, clearAuth } from "../utils/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      clearAuth();
    }
    return Promise.reject(err);
  }
);

// helper functions (including fetchTeacherClasses)
export async function fetchClassDaily(classId, from, to) {
  const res = await api.get(`/reports/class/daily`, {
    params: { class_id: classId, from, to },
  });
  return res.data.data;
}

export async function fetchClassMonthly(classId, year) {
  const res = await api.get(`/reports/class/monthly`, {
    params: { class_id: classId, year },
  });
  return res.data.data;
}

export async function fetchDefaulters(classId, threshold = 75, from, to) {
  const res = await api.get(`/reports/defaulters`, {
    params: { class_id: classId, threshold, from, to },
  });
  return res.data.data;
}

export async function fetchTeacherClasses() {
  const res = await api.get(`/teacher/classes`);
  return res.data.data;
}

export async function fetchTeacherStudents(classId) {
  const res = await api.get("/teacher/students", {
    params: classId ? { class_id: classId } : {}
  });
  return res.data?.data || [];
}


export default api;
