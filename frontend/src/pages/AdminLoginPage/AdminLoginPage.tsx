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
      <button type="button" className={styles.backButton} onClick={() => navigate(routes.entry)}>
        <span aria-hidden="true">←</span>
        <span>Back</span>
      </button>

      <form className={styles.panel} onSubmit={handleSubmit}>
        <div className={styles.iconWrap} aria-hidden="true">◎</div>
        <div className={styles.header}>
          <h1 className={styles.title}>Admin access</h1>
          <p className={styles.subtitle}>Sign in to manage users and review played games.</p>
        </div>

        <div className={styles.field}>
          <label htmlFor="admin-username">Login</label>
          <input
            id="admin-username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              if (error) setError("");
            }}
            placeholder="Enter admin login"
            autoComplete="username"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
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

        {error ? <p className={styles.error}>{error}</p> : <p className={styles.info}>Only administrator accounts can enter here.</p>}

        <button type="submit" className={styles.secondaryButton}>Login</button>
      </form>
    </main>
  );
}
