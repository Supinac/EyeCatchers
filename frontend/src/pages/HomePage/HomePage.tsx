import { GameGrid } from "../../features/game-catalog/components/GameGrid";
import { useGames } from "../../features/game-catalog/hooks/useGames";
import styles from "./HomePage.module.css";

export function HomePage() {
  const { games } = useGames();

  return (
    <main className={styles.page}>
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
