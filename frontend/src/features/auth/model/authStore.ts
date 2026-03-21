import type { AuthState } from "./authTypes";

const STORAGE_KEY = "auth_session";

function normalizeAuthState(value: unknown): AuthState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<AuthState> & { displayName?: string; role?: AuthState["role"] };
  const displayName = typeof candidate.displayName === "string" ? candidate.displayName : "";
  const login = typeof candidate.login === "string" && candidate.login ? candidate.login : displayName.toLowerCase().replace(/\s+/g, "-");
  const userId = typeof candidate.userId === "string" && candidate.userId ? candidate.userId : login;

  if (!displayName || (candidate.role !== "child" && candidate.role !== "admin")) {
    return null;
  }

  return {
    userId,
    login,
    displayName,
    role: candidate.role,
  };
}

export function saveAuthState(value: AuthState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function getAuthState(): AuthState | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return normalizeAuthState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearAuthState() {
  window.localStorage.removeItem(STORAGE_KEY);
}
