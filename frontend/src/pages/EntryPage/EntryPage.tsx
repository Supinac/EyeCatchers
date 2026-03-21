import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { routes } from "../../app/router/routes";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useStudentLogin } from "../../features/auth/hooks/useStudentLogin";
import { AUTH_FIELD_MAX_LENGTH, AUTH_LOGIN_MIN_LENGTH } from "../../features/auth/utils/authValidation";
import styles from "./EntryPage.module.css";

export function EntryPage() {
  const { t } = useTranslation();
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
          <div className={styles.badge}>{t("entry.badge")}</div>
          <h1 className={styles.title}>{t("entry.title")}</h1>
          <p className={styles.subtitle}>{t("entry.subtitle")}</p>
        </div>

        <form className={styles.panel} onSubmit={handleStudentSubmit}>
          <label htmlFor="child-login" className={styles.label}>{t("entry.loginLabel")}</label>
          <input
            id="child-login"
            className={`${styles.input} ${error ? styles.inputError : ""}`}
            value={studentLoginValue}
            onChange={(event) => {
              setStudentLoginValue(event.target.value);
              if (error) clearError();
            }}
            placeholder={t("entry.loginPlaceholder")}
            autoComplete="username"
            minLength={AUTH_LOGIN_MIN_LENGTH}
            maxLength={AUTH_FIELD_MAX_LENGTH}
            disabled={isLoading}
          />

          {error ? <div className={styles.errorBadge}>{error}</div> : <div className={styles.helper}>{t("entry.helper")}</div>}

          <div className={styles.actions}>
            <button type="submit" className={styles.secondaryButton} disabled={isLoading}>
              {isLoading ? t("entry.signingIn") : t("entry.continue")}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={handleAdminClick} disabled={isLoading}>
              {t("entry.admin")}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
