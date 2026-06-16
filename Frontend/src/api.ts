import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const setAuthToken = (token?: string) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const loadStoredToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = localStorage.getItem("accessToken");
  if (stored) {
    setAuthToken(stored);
  }
  return stored;
};

export const apiRequest = async <T>(method: string, url: string, data?: any) => {
  return api.request<T>({ method, url, data });
};

export const getApiBase = () => API_BASE;

export default api;
