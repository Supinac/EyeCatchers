import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { studentLogin } from "../../../api/authApi";
import { ApiError, getApiErrorMessage } from "../../../api/client";
import { validateLogin } from "../utils/authValidation";
import { useAuth } from "./useAuth";

export function useStudentLogin() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = useCallback(
    async (studentLoginValue: string) => {
      const trimmedLogin = studentLoginValue.trim();
      const loginError = validateLogin(trimmedLogin);

      if (loginError) {
        setError(loginError);
        return false;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await studentLogin({ login: trimmedLogin });

        login({
          userId: String(response.id),
          login: response.login,
          displayName: response.name,
          role: "child",
        });

        return true;
      } catch (apiError) {
        if (apiError instanceof ApiError && apiError.status === 401) {
          setError(t("entry.errors.invalidLogin"));
        } else {
          setError(getApiErrorMessage(apiError, t("entry.errors.failed")));
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
