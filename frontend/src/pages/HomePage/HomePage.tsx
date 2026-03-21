import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GameGrid } from "../../features/game-catalog/components/GameGrid";
import { useGames } from "../../features/game-catalog/hooks/useGames";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { routes } from "../../app/router/routes";
import styles from "./HomePage.module.css";

export function HomePage() {
  const { games } = useGames();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getAuthState, logout } = useAuth();
  const auth = getAuthState();

  async function handleLogout() {
    await logout("child");
    navigate(routes.entry, { replace: true });
  }

  const displayName = auth?.displayName || t("home.childFallback");

  return (
    <main className={styles.page}>
      <div className={styles.topbar}>
        <div className={styles.userBadge}>
          <div className={styles.avatar}>{displayName.slice(0, 1).toUpperCase() || "D"}</div>
          <span>{t("home.greeting", { name: displayName })}</span>
        </div>
        <button type="button" className={styles.logoutButton} onClick={handleLogout}>{t("home.logout")}</button>
      </div>

      <div className={styles.header}>
        <h1 className={styles.title}>{t("home.title")}</h1>
        <p className={styles.subtitle}>{t("home.subtitle")}</p>
      </div>

      <div className={styles.gridWrap}>
        <GameGrid games={games} />
      </div>

      <div className={styles.footerHint}>
        <span className={styles.footerIcon} aria-hidden="true">○</span>
        <span>{t("home.footerHint")}</span>
      </div>
    </main>
  );
}
