export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TOKEN_KEY = "documind_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Reads the error message from FastAPI (string or validation list)
const readError = (data) => {
  if (!data || !data.detail) return "Request failed";
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((item) => item.msg).join(", ");
  }
  return "Request failed";
};

// fetch wrapper: adds the login token and parses JSON
export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  // Token expired or invalid -> log the user out
  if (response.status === 401 && token) {
    window.dispatchEvent(new Event("documind:unauthorized"));
  }

  if (!response.ok) {
    throw new Error(readError(data));
  }

  return data;
}