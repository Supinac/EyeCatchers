import { clearAuthState, getAuthState, saveAuthState } from "../model/authStore";
import type { AuthState } from "../model/authTypes";

export function useAuth() {
  return {
    getAuthState,
    login: (value: AuthState) => saveAuthState(value),
    logout: () => clearAuthState(),
  };
}
