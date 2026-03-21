import { useLocation } from "react-router-dom";
import { routes } from "../../app/router/routes";
import { ButtonLink } from "../../components/ui/ButtonLink";
import type { GameResult } from "../../games/core/types/GameResult";
import styles from "./ResultPage.module.css";

function formatLabel(value: string | undefined) {
  if (!value) return "—";
  if (value === "letters") return "Czech letters";
  if (value === "figures") return "Figures";
  if (value === "numbers") return "Numbers";
  if (value === "grid") return "Grid";
  if (value === "random") return "Random positions";
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.statCard}>
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
            <ButtonLink to={routes.games} variant="secondary" className={`${styles.actionButton} ${styles.actionButtonSecondary}`}>
              Back to games
            </ButtonLink>
          </div>
        </section>
      </main>
    );
  }

  const accuracyLabel = result.stats ? `${result.stats.accuracyPercent}%` : "—";
  const correctFoundLabel = result.stats ? `${result.stats.correctHits}/${result.maxScore}` : `${result.score}/${result.maxScore}`;
  const correctTapsLabel = result.stats ? String(result.stats.correctHits) : String(result.score);
  const wrongLabel = result.stats ? String(result.stats.wrongHits) : "0";
  const elapsedLabel = result.stats ? `${result.stats.elapsedSeconds}s` : "—";

  const configPills = [
    `Game: ${formatLabel(result.gameKey)}`,
    result.stats?.previewSeconds ? `Preview: ${result.stats.previewSeconds}s` : null,
    result.stats?.maxGameSeconds ? `Max time: ${result.stats.maxGameSeconds}s` : null,
    result.stats?.contentMode ? `Mode: ${formatLabel(result.stats.contentMode)}` : null,
    result.stats?.placementMode ? `Layout: ${formatLabel(result.stats.placementMode)}` : null,
    result.stats?.gridSize ? `Grid size: ${result.stats.gridSize} × ${result.stats.gridSize}` : null,
    result.stats?.correctObjectCount ? `Right objects: ${result.stats.correctObjectCount}` : null,
    result.stats?.figureSizeMode ? `Figure size: ${formatLabel(result.stats.figureSizeMode)}` : null,
  ].filter(Boolean) as string[];

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.hero}>
          <div className={`${styles.badge} ${result.success ? styles.badgeSuccess : styles.badgeFail}`.trim()}>
            {result.success ? "You won" : "Try again"}
          </div>
          <h1 className={styles.title}>{result.success ? "Great job" : "Round finished"}</h1>
          <p className={styles.subtitle}>
            {result.success
              ? "You found all correct items. Here is a bigger overview of how the round went."
              : "The round has ended. Check the main results below and start another try."}
          </p>
        </div>

        <div className={styles.summaryBlock}>
          <div>
            <span className={styles.summaryLabel}>Correct found</span>
            <div className={styles.summaryValue}>{correctFoundLabel}</div>
          </div>

          <div className={styles.summaryMeta}>
            {configPills.map((pill) => (
              <span key={pill} className={styles.summaryPill}>
                {pill}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.statsGrid}>
          <StatCard label="Accuracy" value={accuracyLabel} />
          <StatCard label="Correct taps" value={correctTapsLabel} />
          <StatCard label="Wrong taps" value={wrongLabel} />
          <StatCard label="Time used" value={elapsedLabel} />
        </div>

        <div className={styles.actions}>
          <ButtonLink to={routes.games} variant="secondary" className={`${styles.actionButton} ${styles.actionButtonSecondary}`}>
            Home
          </ButtonLink>
          {result.gameKey ? (
            <ButtonLink to={`/game/${result.gameKey}`} className={`${styles.actionButton} ${styles.actionButtonPrimary}`}>
              Play again
            </ButtonLink>
          ) : (
            <span />
          )}
        </div>
      </section>
    </main>
  );
}
