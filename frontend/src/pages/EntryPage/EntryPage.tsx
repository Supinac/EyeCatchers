import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { routes } from "../../app/router/routes";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { getUserByLogin } from "../../features/users/model/userStore";
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
      setError("Please enter student login.");
      return;
    }

    const student = getUserByLogin(trimmed, "child");
    if (!student) {
      setError("Student login was not found.");
      return;
    }

    saveLogin({
      userId: student.id,
      login: student.login,
      displayName: `${student.name} ${student.surname}`,
      role: "child",
    });
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
          <p className={styles.subtitle}>Students enter only their login. Administrators use the separate admin screen.</p>
        </div>

        <section className={styles.panel}>
          <label htmlFor="child-login" className={styles.label}>Login</label>
          <input
            id="child-login"
            className={`${styles.input} ${error ? styles.inputError : ""}`}
            value={login}
            onChange={(event) => {
              setLogin(event.target.value);
              if (error) setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleKidEnter();
              }
            }}
            placeholder="Enter login"
            autoComplete="off"
          />

          {error ? <div className={styles.errorBadge}>{error}</div> : <div className={styles.helper}>Use the login created in the admin panel.</div>}

          <div className={styles.actions}>
            <button type="button" className={styles.secondaryButton} onClick={handleKidEnter}>Continue</button>
            <button type="button" className={styles.secondaryButton} onClick={handleAdminClick}>Admin</button>
          </div>
        </section>
      </div>
    </main>
  );
}
