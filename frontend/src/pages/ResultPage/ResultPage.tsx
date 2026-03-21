import { useLocation } from "react-router-dom";
import { routes } from "../../app/router/routes";
import { ButtonLink } from "../../components/ui/ButtonLink";
import type { GameResult } from "../../games/core/types/GameResult";
import styles from "./ResultPage.module.css";

function formatShapeLabel(value: string | undefined) {
  if (!value) return "—";
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StatCard({ label, value, subtle }: { label: string; value: string; subtle?: boolean }) {
  return (
    <div className={`${styles.statCard} ${subtle ? styles.statCardSubtle : ""}`.trim()}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
    </div>
  );
}

export function ResultPage() {
  const location = useLocation();
  const result = (location.state as GameResult | undefined) ?? null;

  if (!result) {
    return (
      <main className={styles.page}>
        <section className={styles.panel}>
          <div className={styles.hero}>
            <div className={styles.badge}>No result yet</div>
            <h1 className={styles.title}>Start a game first</h1>
            <p className={styles.subtitle}>There is no finished round to show on this screen.</p>
          </div>

          <div className={styles.actions}>
            <ButtonLink to={routes.games}>Back to games</ButtonLink>
          </div>
        </section>
      </main>
    );
  }

  const accuracyLabel = result.stats ? `${result.stats.accuracyPercent}%` : "—";
  const elapsedLabel = result.stats ? `${result.stats.elapsedSeconds}s` : "—";
  const remainingLabel = result.stats ? `${result.stats.remainingSeconds}s` : "—";
  const correctLabel = result.stats ? `${result.stats.correctHits}/${result.maxScore}` : `${result.score}/${result.maxScore}`;
  const wrongLabel = result.stats ? String(result.stats.wrongHits) : "—";
  const totalTapsLabel = result.stats ? String(result.stats.totalTaps) : "—";
  const gridLabel = result.stats?.gridSize ? `${result.stats.gridSize} × ${result.stats.gridSize}` : "—";
  const previewLabel = result.stats?.previewSeconds ? `${result.stats.previewSeconds}s` : "—";
  const maxTimeLabel = result.stats?.maxGameSeconds ? `${result.stats.maxGameSeconds}s` : "—";
  const figureSizeLabel = result.stats?.figureSizeMode ? formatShapeLabel(result.stats.figureSizeMode) : "—";
  const targetShapeLabel = formatShapeLabel(result.stats?.targetKind);

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.hero}>
          <div className={`${styles.badge} ${result.success ? styles.badgeSuccess : styles.badgeFail}`.trim()}>
            {result.success ? "You won" : "Time is over"}
          </div>
          <h1 className={styles.title}>{result.success ? "Great job" : "Try again"}</h1>
          <p className={styles.subtitle}>
            {result.success
              ? "You found all correct figures. Here is a bigger overview of how the round went."
              : "The round has ended. You can review the stats below and start a new try."}
          </p>
        </div>

        <div className={styles.scoreBlock}>
          <div>
            <span className={styles.scoreLabel}>Score</span>
            <div className={styles.scoreValue}>
              {result.score}
              <span className={styles.scoreMax}> / {result.maxScore}</span>
            </div>
          </div>
          <div className={styles.scoreMeta}>
            <span className={styles.scorePill}>Game: {formatShapeLabel(result.gameKey)}</span>
            <span className={styles.scorePill}>Difficulty: {formatShapeLabel(result.difficulty)}</span>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <StatCard label="Correct found" value={correctLabel} />
          <StatCard label="Wrong taps" value={wrongLabel} />
          <StatCard label="Time used" value={elapsedLabel} subtle />
          <StatCard label="Grid size" value={gridLabel} subtle />
        </div>

        <div className={styles.actions}>
          <ButtonLink to={routes.games} variant="secondary" className={styles.actionButton}>
            Home
          </ButtonLink>
          {result.gameKey ? (
            <ButtonLink to={`/game/${result.gameKey}`} className={styles.actionButton}>
              Play again
            </ButtonLink>
          ) : null}
        </div>
      </section>
    </main>
  );
}
