import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { routes } from "../../app/router/routes";
import styles from "./EntryPage.module.css";

export function EntryPage() {
  const [login, setLogin] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login: saveLogin, getAuthState } = useAuth();

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

  function handleKidEnter() {
    const trimmed = login.trim();
    if (!trimmed) {
      setError("Please enter a child login.");
      return;
    }

    saveLogin({ displayName: trimmed, role: "child" });
    navigate(routes.games);
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
          <p className={styles.subtitle}>For a child, enter only the login name. For an admin, open the admin login screen.</p>
        </div>

        <section className={styles.panel}>
          <label htmlFor="child-login" className={styles.label}>Child login</label>
          <input
            id="child-login"
            className={styles.input}
            value={login}
            onChange={(event) => {
              setLogin(event.target.value);
              if (error) setError("");
            }}
            placeholder="Enter name or login"
            autoComplete="off"
          />

          {error ? <p className={styles.error}>{error}</p> : <p className={styles.hint}></p>}

          <div className={styles.actions}>
            <button type="button" className={styles.secondaryButton} onClick={handleKidEnter}>Enter as child</button>
            <button type="button" className={styles.secondaryButton} onClick={handleAdminClick}>Admin</button>
          </div>
        </section>
      </div>
    </main>
  );
}
