import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { routes } from "../../app/router/routes";
import { useAdminLogin } from "../../features/auth/hooks/useAdminLogin";
import { useAuth } from "../../features/auth/hooks/useAuth";
import styles from "./AdminLoginPage.module.css";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { getAuthState } = useAuth();
  const { submit, isLoading, error, clearError } = useAdminLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const existing = getAuthState();
    if (existing?.role === "admin") {
      navigate(routes.adminDashboard, { replace: true });
      return;
    }
    if (existing?.role === "child") {
      navigate(routes.games, { replace: true });
    }
  }, [getAuthState, navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const success = await submit(username, password);
    if (success) {
      navigate(routes.adminDashboard);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.headerBlock}>
          <div className={styles.badge}>Administrator</div>
          <h1 className={styles.title}>Admin access</h1>
          <p className={styles.subtitle}>Use login and password to enter the administrator dashboard.</p>
        </div>

        <form className={styles.panel} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label htmlFor="admin-username" className={styles.label}>Login</label>
            <input
              id="admin-username"
              className={`${styles.input} ${error ? styles.inputError : ""}`}
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                if (error) clearError();
              }}
              placeholder="Enter admin login"
              autoComplete="username"
              disabled={isLoading}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="admin-password" className={styles.label}>Password</label>
            <input
              id="admin-password"
              className={`${styles.input} ${error ? styles.inputError : ""}`}
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) clearError();
              }}
              placeholder="Enter password"
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          {error ? <div className={styles.errorBadge}>{error}</div> : <div className={styles.helper}>Only administrator accounts can enter here.</div>}

          <div className={styles.actions}>
            <button type="submit" className={styles.secondaryButton} disabled={isLoading}>
              {isLoading ? "Signing in..." : "Login"}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => navigate(routes.entry)} disabled={isLoading}>
              Student login
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
