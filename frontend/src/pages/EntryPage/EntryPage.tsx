import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { routes } from "../../app/router/routes";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useStudentLogin } from "../../features/auth/hooks/useStudentLogin";
import styles from "./EntryPage.module.css";

export function EntryPage() {
  const [studentLoginValue, setStudentLoginValue] = useState("");
  const navigate = useNavigate();
  const { getAuthState } = useAuth();
  const { submit, isLoading, error, clearError } = useStudentLogin();

  useEffect(() => {
    const existing = getAuthState();
    if (existing?.role === "child") {
      navigate(routes.games, { replace: true });
      return;
    }
    if (existing?.role === "admin") {
      navigate(routes.adminDashboard, { replace: true });
    }
  }, [getAuthState, navigate]);

  async function handleStudentSubmit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const success = await submit(studentLoginValue);

    if (success) {
      navigate(routes.games);
    }
  }

  function handleAdminClick() {
    navigate(routes.adminLogin);
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.headerBlock}>
          <div className={styles.badge}>Welcome</div>
          <h1 className={styles.title}>Who is playing today?</h1>
          <p className={styles.subtitle}>Students enter only their login. Administrators use the separate admin screen.</p>
        </div>

        <form className={styles.panel} onSubmit={handleStudentSubmit}>
          <label htmlFor="child-login" className={styles.label}>Login</label>
          <input
            id="child-login"
            className={`${styles.input} ${error ? styles.inputError : ""}`}
            value={studentLoginValue}
            onChange={(event) => {
              setStudentLoginValue(event.target.value);
              if (error) clearError();
            }}
            placeholder="Enter login"
            autoComplete="username"
            disabled={isLoading}
          />

          {error ? <div className={styles.errorBadge}>{error}</div> : <div className={styles.helper}>Use the login created in the admin panel.</div>}

          <div className={styles.actions}>
            <button type="submit" className={styles.secondaryButton} disabled={isLoading}>
              {isLoading ? "Signing in..." : "Continue"}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={handleAdminClick} disabled={isLoading}>
              Admin
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
