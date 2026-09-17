// Thin fetch wrapper for the FastAPI backend.
// Reads VITE_API_BASE; falls back to http://127.0.0.1:8000.
// Token state lives in localStorage so a page reload doesn't drop the session.

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8000";

const TOKEN_KEY = "mcp_access_token";
const REFRESH_KEY = "mcp_refresh_token";
const PROFILE_KEY_PREFIX = "mcp_profile_";

// Returns the canonical localStorage key for a user's rich profile blob.
// Falls back to a stable placeholder when no user is available, so the
// caller never has to special-case "no user yet".
export function profileKey(user) {
  const id = user?.id || user?._id;
  return id ? `${PROFILE_KEY_PREFIX}${id}` : `${PROFILE_KEY_PREFIX}anon`;
}

// Read a user's rich profile from localStorage. A missing, empty, or
// corrupted JSON blob is treated as an empty object so a single bad
// write (truncated JSON, devtools tinkering, schema migration) cannot
// crash the wizard / profile page on next load.
export function readProfile(user) {
  try {
    const raw = localStorage.getItem(profileKey(user));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    // Corrupted JSON — wipe the bad blob and return a fresh empty profile
    // so the user can keep going. The next save will overwrite this slot.
    try { localStorage.removeItem(profileKey(user)); } catch { /* ignore */ }
    return {};
  }
}

// Write a partial profile object back to localStorage. Returns true on
// success, false if storage is unavailable / full (Safari private mode,
// quota errors). We merge into the existing blob so a caller can patch
// just one section without trampling the rest.
export function writeProfile(user, partial) {
  try {
    const existing = readProfile(user);
    const next = { ...existing, ...partial };
    localStorage.setItem(profileKey(user), JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

// Same as readProfile but takes a raw userId string (used by the modals
// that already receive `userId` as a prop, not a full user object).
export function readProfileById(userId) {
  if (!userId) return {};
  try {
    const raw = localStorage.getItem(`${PROFILE_KEY_PREFIX}${userId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    try { localStorage.removeItem(`${PROFILE_KEY_PREFIX}${userId}`); } catch { /* ignore */ }
    return {};
  }
}

// Same as writeProfile but takes a raw userId string.
export function writeProfileById(userId, partial) {
  if (!userId) return false;
  try {
    const existing = readProfileById(userId);
    const next = { ...existing, ...partial };
    localStorage.setItem(`${PROFILE_KEY_PREFIX}${userId}`, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export function formatAccountError(err, fallback = "Request failed") {
  const message = err?.message || fallback;
  if (err?.status !== 400) return message;

  const match = message.match(/registered as an?\s+([^.!?]+)/i);
  if (!match) return message;

  const role = match[1].trim();
  return `Account exists as a ${role.charAt(0).toUpperCase()}${role.slice(1)}. Please select the correct role tab to sign in.`;
}

export function isAccountRoleConflict(err) {
  return err?.status === 400 && /already registered as/i.test(err?.message || "");
}

export function getAuthToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem("mcp_admin_token") ||
    ""
  );
}

export const auth = {
  getAccessToken: () => getAuthToken(),
  getRefreshToken: () =>
    localStorage.getItem(REFRESH_KEY) ||
    localStorage.getItem("refresh_token") ||
    "",
  setTokens: ({ access_token, refresh_token }) => {
    if (access_token) {
      localStorage.setItem(TOKEN_KEY, access_token);
      localStorage.setItem("token", access_token);
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("mcp_admin_token", access_token);
    }
    if (refresh_token) {
      localStorage.setItem(REFRESH_KEY, refresh_token);
      localStorage.setItem("refresh_token", refresh_token);
    }
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("mcp_admin_token");
    localStorage.removeItem("refresh_token");
  },
  isAuthenticated: () => Boolean(getAuthToken()),
};

async function request(path, { method = "GET", body, auth: needsAuth = false, headers: customHeaders = {} } = {}) {
  const isMultipart = typeof FormData !== "undefined" && body instanceof FormData;
  const headers = { ...(isMultipart ? {} : { "Content-Type": "application/json" }), ...customHeaders };
  if (needsAuth) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isMultipart ? body : JSON.stringify(body)) : undefined,
  });

  // Fallback between /api/v1/ and /api/ in case the server uses the alternate prefix
  if (res.status === 404 && path.startsWith("/api/v1/")) {
    const fallbackPath = path.replace(/^\/api\/v1\//, "/api/");
    try {
      const fallbackRes = await fetch(`${API_BASE}${fallbackPath}`, {
        method,
        headers,
        body: body ? (isMultipart ? body : JSON.stringify(body)) : undefined,
      });
      if (fallbackRes.ok || fallbackRes.status !== 404) {
        res = fallbackRes;
      }
    } catch {
      // Retain original response
    }
  }

  if (res.status === 204) return null;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      data?.detail || data?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// CSV exports are binary responses, so they deliberately bypass request(),
// which parses successful responses as JSON.
async function downloadAdminCsv(path) {
  const headers = api._adminHeaders();
  let response = await fetch(`${API_BASE}${path}`, { headers });
  if (response.status === 404 && path.startsWith("/api/v1/")) {
    response = await fetch(`${API_BASE}${path.replace(/^\/api\/v1\//, "/api/")}`, { headers });
  }
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      detail = data?.detail || data?.message || detail;
    } catch { /* A non-JSON error response still gets a useful fallback. */ }
    throw new Error(detail);
  }
  return response.blob();
}

export const api = {
  base: API_BASE,

  health: () => request("/health"),

  // OTP auth — replaces the old /register and /login/access-token flow.
  sendOtp: ({ identifier, full_name, role, is_signup }) =>
    request("/api/auth/send-otp", {
      method: "POST",
      body: { identifier, full_name, role, is_signup },
    }),
  verifyOtp: ({ identifier, code, role, is_signup }) =>
    request("/api/auth/verify-otp", {
      method: "POST",
      body: { identifier, code, role, is_signup },
    }),
  register: ({ identifier, password, role, full_name }) =>
    request("/api/auth/register", { method: "POST", body: { identifier, password, role, full_name } }),
  login: ({ identifier, password }) =>
    request("/api/v1/auth/login", { method: "POST", body: { identifier, password } }),
  sendPasswordResetOtp: ({ identifier }) =>
    request("/api/v1/auth/forgot-password/send-otp", { method: "POST", body: { identifier } }),
  resetPassword: ({ identifier, code, password }) =>
    request("/api/v1/auth/forgot-password/reset", { method: "POST", body: { identifier, code, password } }),
  adminLogin: ({ identifier, password }) =>
    request("/api/v1/admin/login", { method: "POST", body: { identifier, password } }),
  requestAdminPasswordReset: ({ email }) =>
    request("/api/v1/admin/forgot-password", { method: "POST", body: { email } }),
  me: () => request("/api/auth/me", { auth: true }),
  refresh: (refresh_token) =>
    request("/api/auth/refresh-token", {
      method: "POST",
      body: { refresh_token },
    }),
  logout: () => auth.clear(),

  // Items (read-only sample — full CRUD wiring deferred)
  listItems: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", params.page);
    if (params.size) qs.set("size", params.size);
    if (params.search) qs.set("search", params.search);
    const q = qs.toString();
    return request(`/api/items/${q ? `?${q}` : ""}`, { auth: true });
  },
  // Get the caller's items. The backend's GET /api/items/ scopes to the
  // current user (owner_id == current_user.id) and supports pagination +
  // `tag` / `search` filters. Returns a PaginatedItems payload.
  getItems: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", params.page);
    if (params.size) qs.set("size", params.size);
    if (params.tag) qs.set("tag", params.tag);
    if (params.search) qs.set("search", params.search);
    const q = qs.toString();
    return request(`/api/items/${q ? `?${q}` : ""}`, { auth: true });
  },
  getPublicJobs: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", params.page);
    if (params.size) qs.set("size", params.size);
    if (params.search) qs.set("search", params.search);
    const q = qs.toString();
    return request(`/api/items/public${q ? `?${q}` : ""}`);
  },
  getSuggestedSkills: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.role) qs.set("role", params.role);
    if (params.education) qs.set("education", params.education);
    if (params.preferred_title) qs.set("preferred_title", params.preferred_title);
    const q = qs.toString();
    return request(`/api/users/suggested-skills${q ? `?${q}` : ""}`, { auth: true });
  },
  // Create a new item owned by the current user. Job payloads also include
  // verified-company fields: company_name, company_website, company_address,
  // and company_tax_id. Tags should be a list of strings.
  createItem: (payload) =>
    request("/api/items/", {
      method: "POST",
      body: payload,
      auth: true,
    }),
  // Update a job posting owned by the current recruiter.
  updateItem: (id, payload) =>
    request(`/api/items/${id}`, {
      method: "PUT",
      body: payload,
      auth: true,
    }),
  // Permanently delete a job posting owned by the current recruiter.
  deleteItem: (id) =>
    request(`/api/items/${id}`, {
      method: "DELETE",
      auth: true,
    }),

  // Applications: role-aware list. Recruiters/admins get
  // applications for jobs they own (joined with candidate + job
  // title); candidates get their own applications. Backed by
  // GET /api/applications/ on the backend (mounted below the configured
  // API_V1_STR; this project currently configures it as /api).
  //   params: { page?, size?, status?, job_id? }
  getApplications: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", params.page);
    if (params.size) qs.set("size", params.size);
    if (params.status) qs.set("status", params.status);
    if (params.job_id) qs.set("job_id", params.job_id);
    const q = qs.toString();
    return request(`/api/applications/${q ? `?${q}` : ""}`, { auth: true });
  },
  // POST /api/applications/ — submit a job application.
  //   payload: { job_id, cover_letter?, resume_url? }
  createApplication: (payload) =>
    request("/api/applications/", {
      method: "POST",
      body: payload,
      auth: true,
    }),
  // PATCH /api/applications/{id}/status — recruiter application stage update.
  // A stage change triggers the backend's preference-aware email/SMS service.
  updateApplicationStatus: (id, status, details = {}) =>
    request(`/api/applications/${id}/status`, {
      method: "PATCH",
      body: { status, details },
      auth: true,
    }),
  scheduleInterview: (id, details) => request(`/api/applications/${id}/schedule-interview`, { method: "POST", body: details, auth: true }),
  getNotifications: () => request("/api/v1/notifications", { auth: true }),
  markNotificationRead: (id) => request(`/api/v1/notifications/${id}/read`, { method: "PATCH", auth: true }),

  // Recruiter dashboard summary: open jobs, weekly applications/interviews,
  // and hires this month.
  getRecruiterMetrics: () => request("/api/reports/metrics", { auth: true }),
  getMonthlyReports: () => request("/api/reports/monthly-applications", { auth: true }),

  // AI support chatbot. POST /api/chat.
  //   payload: { message: string, history?: Array<{role, content}> }
  //   Returns: { reply: string, status: string }
  // The backend (app/api/v1/endpoints/chatbot.py) feeds `history` into
  // the Gemini call as a multi-turn context, so we pass the
  // conversation so far on every request. No auth required.
  chat: ({ message, history = [] }) =>
    request("/api/chat", {
      method: "POST",
      body: { message, history },
      auth: true,
    }),

  // Update the current user's profile. Calls PUT /api/users/{id}.
  // `payload` can include { full_name, phone } and any other fields
  // the backend's UserUpdate schema accepts. Rich profile fields
  // (skills, certifications, education, experience) are not yet in
  // the backend schema and are stored in localStorage by the profile
  // page until the backend exposes them.
  updateProfile: (id, payload) =>
    request(`/api/users/${id}`, {
      method: "PUT",
      body: payload,
      auth: true,
    }),
  updateNotificationPreferences: (preferences) => request("/api/v1/users/notification-preferences", { method: "PATCH", body: preferences, auth: true }),
  uploadProfilePhoto: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return request("/api/users/profile-photo", { method: "POST", body: formData, auth: true }).then((data) => ({
      ...data,
      profile_photo_url: data?.profile_photo_url?.startsWith("http") ? data.profile_photo_url : data?.profile_photo_url ? `${API_BASE}${data.profile_photo_url}` : data?.profile_photo_url,
    }));
  },
  uploadCertificate: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return request("/api/users/certifications/upload", { method: "POST", body: formData, auth: true });
  },

  // Permanently remove the authenticated account and its role-scoped data.
  deleteAccount: () => request("/api/users/me", { method: "DELETE", auth: true }),

  // Admin API endpoints — all require admin role authentication.
  // Belt-and-suspenders: auth:true injects the header via request(), AND we
  // pass the token explicitly through `headers` so the Bearer is guaranteed
  // even in edge cases (e.g. when the admin was signed in via a different tab).
  _adminHeaders: () => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("mcp_access_token") ||
      localStorage.getItem("mcp_admin_token") ||
      getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // GET http://localhost:8000/api/v1/admin/stats
  getAdminStats() {
    return request("/api/v1/admin/stats", { auth: true, headers: this._adminHeaders() });
  },
  // GET http://localhost:8000/api/v1/admin/overview
  getAdminOverview() {
    return request("/api/v1/admin/overview", { auth: true, headers: this._adminHeaders() });
  },

  // GET http://localhost:8000/api/v1/admin/users — paginated user list with filters & schema normalization
  //   params: { page?, size?, role?, search? }
  async getAdminUsers(params = {}) {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", params.page);
    if (params.size) qs.set("size", params.size);
    if (params.role) qs.set("role", params.role);
    if (params.search) qs.set("search", params.search);
    const q = qs.toString();
    const data = await request(`/api/v1/admin/users${q ? `?${q}` : ""}`, {
      auth: true,
      headers: this._adminHeaders(),
    });

    const rawItems = Array.isArray(data) ? data : (data?.items || []);
    const normalizedItems = rawItems.map((u) => {
      const name =
        u.full_name ||
        u.profile_name ||
        u.name ||
        (u.role === "recruiter" && (u.company_name || u.company)) ||
        (u.email ? u.email.split("@")[0] : "") ||
        "Unnamed user";

      const email = u.email || u.registered_email || u.phone || "";
      const company = u.company_name || u.company || "";
      const appCount =
        u.applications_count ??
        u.applications ??
        (Array.isArray(u.applications) ? u.applications.length : 0);

      return {
        ...u,
        id: u.id || u._id,
        _id: u._id || u.id,
        full_name: name,
        profile_name: name,
        name,
        email,
        registered_email: email,
        company_name: company,
        company,
        applications_count: appCount,
        applications: appCount,
      };
    });

    if (Array.isArray(data)) {
      return normalizedItems;
    }
    return {
      ...data,
      items: normalizedItems,
    };
  },

  // PATCH http://localhost:8000/api/v1/admin/users/{user_id} — update user role/is_active
  updateAdminUser(userId, payload) {
    return request(`/api/v1/admin/users/${userId}`, {
      method: "PATCH",
      body: payload,
      auth: true,
      headers: this._adminHeaders(),
    });
  },

  // PATCH http://localhost:8000/api/v1/admin/users/{user_id}/status
  //   payload: { status: "active" | "suspended" | "verified" }
  updateUserStatus(userId, status) {
    return request(`/api/v1/admin/users/${userId}/status`, {
      method: "PATCH",
      body: { status },
      auth: true,
      headers: this._adminHeaders(),
    });
  },

  // DELETE http://localhost:8000/api/v1/admin/users/{user_id}
  deleteAdminUser(userId) {
    return request(`/api/v1/admin/users/${userId}`, {
      method: "DELETE",
      auth: true,
      headers: this._adminHeaders(),
    });
  },

  // GET http://localhost:8000/api/v1/admin/recruiters/pending
  async getAdminPendingCompanies() {
    const data = await request("/api/v1/admin/recruiters/pending", {
      auth: true,
      headers: this._adminHeaders(),
    });
    const rawItems = Array.isArray(data) ? data : (data?.items || []);
    return rawItems.map((c) => {
      const company = c.company_name || c.company || "Company not provided";
      const recruiterName = c.full_name || c.name || "Unnamed recruiter";
      return {
        ...c,
        id: c.id || c._id,
        _id: c._id || c.id,
        company_name: company,
        company,
        full_name: recruiterName,
        name: recruiterName,
        email: c.email || c.registered_email || c.phone || "",
      };
    });
  },

  // PATCH http://localhost:8000/api/v1/admin/companies/{user_id}
  //   payload: { approved: boolean, reason?: string }
  decideAdminCompany(userId, payload) {
    return request(`/api/v1/admin/companies/${userId}`, {
      method: "PATCH",
      body: payload,
      auth: true,
      headers: this._adminHeaders(),
    });
  },

  // PATCH http://localhost:8000/api/v1/admin/recruiters/{user_id}/verify
  verifyRecruiter(userId, approved, reason = "") {
    return request(`/api/v1/admin/recruiters/${userId}/verify`, {
      method: "PATCH",
      body: { approved, reason },
      auth: true,
      headers: this._adminHeaders(),
    });
  },

  // GET http://localhost:8000/api/v1/admin/jobs — all job postings with schema normalization
  //   params: { page?, size? }
  async getAdminJobs(params = {}) {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", params.page);
    if (params.size) qs.set("size", params.size);
    const q = qs.toString();
    const data = await request(`/api/v1/admin/jobs${q ? `?${q}` : ""}`, {
      auth: true,
      headers: this._adminHeaders(),
    });

    const rawItems = Array.isArray(data) ? data : (data?.items || []);
    const normalizedItems = rawItems.map((job) => {
      const companyName = job.company_name || job.company || "Company not provided";
      const title = job.title || "Untitled Job";
      return {
        ...job,
        id: job.id || job._id,
        _id: job._id || job.id,
        title,
        company_name: companyName,
        company: companyName,
      };
    });

    if (Array.isArray(data)) {
      return normalizedItems;
    }
    return {
      ...data,
      items: normalizedItems,
    };
  },

  // PATCH http://localhost:8000/api/v1/admin/jobs/{job_id} — update job (suspend/unpublish)
  updateAdminJob(jobId, payload) {
    return request(`/api/v1/admin/jobs/${jobId}`, {
      method: "PATCH",
      body: payload,
      auth: true,
      headers: this._adminHeaders(),
    });
  },

  // DELETE http://localhost:8000/api/v1/admin/jobs/{job_id}
  deleteAdminJob(jobId) {
    return request(`/api/v1/admin/jobs/${jobId}`, {
      method: "DELETE",
      auth: true,
      headers: this._adminHeaders(),
    });
  },

  // GET http://localhost:8000/api/v1/admin/reports
  getAdminReports() {
    return request("/api/v1/admin/reports", { auth: true, headers: this._adminHeaders() });
  },
  downloadAdminReport(kind) {
    const endpoint = kind === "candidates" ? "/api/v1/admin/reports/candidates/export" : "/api/v1/admin/reports/jobs/export";
    return downloadAdminCsv(endpoint);
  },
};
