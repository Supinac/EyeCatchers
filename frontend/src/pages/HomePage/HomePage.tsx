import { useNavigate } from "react-router-dom";
import { GameGrid } from "../../features/game-catalog/components/GameGrid";
import { useGames } from "../../features/game-catalog/hooks/useGames";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { routes } from "../../app/router/routes";
import styles from "./HomePage.module.css";

export function HomePage() {
  const { games } = useGames();
  const navigate = useNavigate();
  const { getAuthState, logout } = useAuth();
  const auth = getAuthState();

  function handleLogout() {
    logout();
    navigate(routes.entry);
  }

  return (
    <main className={styles.page}>
      <div className={styles.topbar}>
        <div className={styles.userBadge}>
          <div className={styles.avatar}>{auth?.displayName?.slice(0, 1).toUpperCase() || "C"}</div>
          <span>Hello, {auth?.displayName || "Child"}</span>
        </div>
        <button type="button" className={styles.logoutButton} onClick={handleLogout}>Logout</button>
      </div>

      <div className={styles.header}>
        <h1 className={styles.title}>Choose a game</h1>
        <p className={styles.subtitle}>Large calm tiles with a black and white design.</p>
      </div>

      <div className={styles.gridWrap}>
        <GameGrid games={games} />
      </div>

      <div className={styles.footerHint}>
        <span className={styles.footerIcon} aria-hidden="true">○</span>
        <span>Tap a tile to continue</span>
      </div>
    </main>
  );
}
