import { adminLogout, userLogout } from "../../../api/authApi";
import { clearAuthState, getAuthState, saveAuthState } from "../model/authStore";
import type { AuthState } from "../model/authTypes";

async function logoutFromApi(role?: AuthState["role"]) {
  const resolvedRole = role ?? getAuthState()?.role;

  try {
    if (resolvedRole === "admin") {
      await adminLogout();
      return;
    }

    if (resolvedRole === "child") {
      await userLogout();
    }
  } catch {
    // Ignore logout API failures and still clear local auth state.
  } finally {
    clearAuthState();
  }
}

export function useAuth() {
  return {
    getAuthState,
    login: (value: AuthState) => saveAuthState(value),
    logout: (role?: AuthState["role"]) => logoutFromApi(role),
    logoutLocal: () => clearAuthState(),
  };
}
