import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { routes } from "../../app/router/routes";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { validateAdminCredentials } from "../../features/users/model/userStore";
import styles from "./AdminLoginPage.module.css";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, getAuthState } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const admin = validateAdminCredentials(username, password);
    if (!admin) {
      setError("Invalid admin credentials.");
      return;
    }

    login({
      userId: admin.id,
      login: admin.login,
      displayName: `${admin.name} ${admin.surname}`,
      role: "admin",
    });
    navigate(routes.adminDashboard);
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>

        <div className={styles.headerBlock}>
          <div className={styles.badge}>Administrator</div>
          <h1 className={styles.title}>Admin access</h1>
          <p className={styles.subtitle}>Use the same calm login style, but with both login and password for administrators.</p>
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
                if (error) setError("");
              }}
              placeholder="Enter admin login"
              autoComplete="username"
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
                if (error) setError("");
              }}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <div className={styles.errorBadge}>{error}</div>
          ) : (
            <div className={styles.helper}>Only administrator accounts can enter here.</div>
          )}

          <div className={styles.actions}>
            <button type="submit" className={styles.secondaryButton}>Login</button>
            <button type="button" className={styles.secondaryButton} onClick={() => navigate(routes.entry)}>
              Student login
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
