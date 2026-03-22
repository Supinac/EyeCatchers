import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminLogin } from "../../../api/authApi";
import { ApiError, getApiErrorMessage } from "../../../api/client";
import { validateLogin, validatePassword } from "../utils/authValidation";
import { useAuth } from "./useAuth";

export function useAdminLogin() {
  const { t } = useTranslation();
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
        if (apiError instanceof ApiError && apiError.status === 401) {
          setError(t("adminLogin.errors.invalidCredentials"));
        } else {
          setError(getApiErrorMessage(apiError, t("adminLogin.errors.failed")));
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [login, t],
  );

  return {
    submit,
    isLoading,
    error,
    clearError: () => setError(""),
  };
}
