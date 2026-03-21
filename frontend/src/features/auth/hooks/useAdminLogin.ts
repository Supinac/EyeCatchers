import { useCallback, useState } from "react";
import { adminLogin } from "../../../api/authApi";
import { getApiErrorMessage } from "../../../api/client";
import { validateLogin, validatePassword } from "../utils/authValidation";
import { useAuth } from "./useAuth";

export function useAdminLogin() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = useCallback(
    async (loginValue: string, passwordValue: string) => {
      const trimmedLogin = loginValue.trim();
      const trimmedPassword = passwordValue.trim();

      const loginError = validateLogin(trimmedLogin);
      if (loginError) {
        setError(loginError);
        return false;
      }

      const passwordError = validatePassword(trimmedPassword);
      if (passwordError) {
        setError(passwordError);
        return false;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await adminLogin({
          login: trimmedLogin,
          password: trimmedPassword,
        });

        login({
          userId: String(response.id),
          login: response.login,
          displayName: response.name,
          role: "admin",
        });

        return true;
      } catch (apiError) {
        setError(getApiErrorMessage(apiError, "Admin login failed."));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [login],
  );

  return {
    submit,
    isLoading,
    error,
    clearError: () => setError(""),
  };
}
