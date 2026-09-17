import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000';
    }
    return 'http://127.0.0.1:8000';
  }
  return 'http://192.168.1.X:8000'; 
};

export const API_BASE = getBaseUrl();
const TOKEN_KEY = "mcp_access_token";

export async function getAuthToken() {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return token || "";
  } catch (err) {
    console.error("SecureStore error:", err);
    return "";
  }
}

export const auth = {
  getAccessToken: getAuthToken,
  setToken: async (access_token) => {
    try {
      if (access_token) await SecureStore.setItemAsync(TOKEN_KEY, access_token);
    } catch (err) {
      console.error("Failed to save tokens", err);
    }
  },
  clear: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (err) {
      console.error("Failed to clear tokens", err);
    }
  },
  isAuthenticated: async () => {
    const token = await getAuthToken();
    return Boolean(token);
  },
};

export async function request(path, { method = "GET", body, auth: needsAuth = false, headers: customHeaders = {} } = {}) {
  const headers = { "Content-Type": "application/json", ...customHeaders };
  if (needsAuth) {
    const token = await getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 404 && path.startsWith("/api/v1/")) {
    const fallbackPath = path.replace(/^\/api\/v1\//, "/api/");
    try {
      const fallbackRes = await fetch(`${API_BASE}${fallbackPath}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
      if (fallbackRes.ok || fallbackRes.status !== 404) {
        res = fallbackRes;
      }
    } catch {}
  }

  if (res.status === 204) return null;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.detail || data?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  sendOtp: (payload) => request("/api/v1/auth/send-otp", { method: "POST", body: payload }),
  verifyOtp: async (payload) => {
    const data = await request("/api/v1/auth/verify-otp", { method: "POST", body: payload });
    if (data.access_token) {
      await auth.setToken(data.access_token);
    }
    return data;
  },
  getMe: () => request("/api/auth/me", { auth: true }),
  
  // Public
  getPublicJobs: () => request("/api/items/public"),
  
  // Auth required
  getItems: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/items/${qs ? "?" + qs : ""}`, { auth: true });
  },
  getApplications: () => request("/api/applications/", { auth: true }),
  updateApplicationStatus: (app_id, status, details) => request(`/api/applications/${app_id}/status`, { method: "PATCH", body: { status, ...(details ? { details } : {}) }, auth: true }),
  scheduleInterview: (app_id, details) => request(`/api/applications/${app_id}/schedule-interview`, { method: "POST", body: details, auth: true }),
  getAdminStats: () => request("/api/v1/admin/stats", { auth: true }),
  getAdminUsers: () => request("/api/v1/admin/users", { auth: true }),
};
