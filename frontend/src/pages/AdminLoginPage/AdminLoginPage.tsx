import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { routes } from "../../app/router/routes";
import { useAdminLogin } from "../../features/auth/hooks/useAdminLogin";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { AUTH_FIELD_MAX_LENGTH, AUTH_LOGIN_MIN_LENGTH, AUTH_PASSWORD_MIN_LENGTH } from "../../features/auth/utils/authValidation";
import styles from "./AdminLoginPage.module.css";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
            <div className={styles.badge}>{t("adminLogin.badge")}</div>
            <h1 className={styles.title}>{t("adminLogin.title")}</h1>
            <p className={styles.subtitle}>{t("adminLogin.subtitle")}</p>
          </div>

          <form className={styles.panel} onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label htmlFor="admin-username" className={styles.label}>{t("adminLogin.loginLabel")}</label>
              <input
                  id="admin-username"
                  className={`${styles.input} ${error ? styles.inputError : ""}`}
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    if (error) clearError();
                  }}
                  placeholder={t("adminLogin.loginPlaceholder")}
                  autoComplete="username"
                  minLength={AUTH_LOGIN_MIN_LENGTH}
                  maxLength={AUTH_FIELD_MAX_LENGTH}
                  disabled={isLoading}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="admin-password" className={styles.label}>{t("adminLogin.passwordLabel")}</label>
              <input
                  id="admin-password"
                  className={`${styles.input} ${error ? styles.inputError : ""}`}
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) clearError();
                  }}
                  placeholder={t("adminLogin.passwordPlaceholder")}
                  autoComplete="current-password"
                  minLength={AUTH_PASSWORD_MIN_LENGTH}
                  maxLength={AUTH_FIELD_MAX_LENGTH}
                  disabled={isLoading}
              />
            </div>

            {error ? <div className={styles.errorBadge}>{error}</div> : <div className={styles.helper}>{t("adminLogin.helper")}</div>}

            <div className={styles.actions}>
              <button type="submit" className={styles.secondaryButton} disabled={isLoading}>
                {isLoading ? t("adminLogin.signingIn") : t("adminLogin.login")}
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => navigate(routes.entry)} disabled={isLoading}>
                {t("adminLogin.studentLogin")}
              </button>
            </div>
          </form>
        </div>
      </main>
  );
}
