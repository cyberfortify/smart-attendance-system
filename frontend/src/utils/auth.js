// Simple auth helpers to get/set token in localStorage
const TOKEN_KEY = "att_token";
const USER_KEY = "att_user";

export function saveAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user || {}));
}

export function getToken() {
  return localStorage.getItem("token");
}

export function getUser() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}