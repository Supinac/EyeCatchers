import { useCallback, useState } from "react";
import { studentLogin } from "../../../api/authApi";
import { getApiErrorMessage } from "../../../api/client";
import { useAuth } from "./useAuth";

export function useStudentLogin() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = useCallback(
    async (studentLoginValue: string) => {
      const trimmedLogin = studentLoginValue.trim();

      if (!trimmedLogin) {
        setError("Please enter student login.");
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
        setError(getApiErrorMessage(apiError, "Student login failed."));
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
