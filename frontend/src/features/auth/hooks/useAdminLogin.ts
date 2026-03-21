import { useCallback, useState } from "react";
import { adminLogin } from "../../../api/authApi";
import { getApiErrorMessage } from "../../../api/client";
import { useAuth } from "./useAuth";

export function useAdminLogin() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = useCallback(
    async (loginValue: string, passwordValue: string) => {
      const trimmedLogin = loginValue.trim();
      const trimmedPassword = passwordValue.trim();

      if (!trimmedLogin || !trimmedPassword) {
        setError("Please enter login and password.");
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
