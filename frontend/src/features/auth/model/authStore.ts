import type { AuthState } from "./authTypes";

const STORAGE_KEY = "autism_auth_session";

export function saveAuthState(value: AuthState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function getAuthState(): AuthState | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as AuthState) : null;
}

export function clearAuthState() {
  window.localStorage.removeItem(STORAGE_KEY);
}
