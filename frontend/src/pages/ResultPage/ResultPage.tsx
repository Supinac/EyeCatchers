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
  if (value === "fixed") return "Fixed";
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatMaxTime(value: string | number | undefined) {
  if (!value) return null;
  return value === "unlimited" ? "Max time: Unlimited" : `Max time: ${value}s`;
}

function getConfigPills(result: GameResult): string[] {
  if (result.gameKey === "find-circle") {
    return [
      `Game: Find Circle`,
      result.stats?.previewSeconds ? `Preview: ${result.stats.previewSeconds}s` : null,
      formatMaxTime(result.stats?.maxGameSeconds),
      result.stats?.contentMode ? `Mode: ${formatLabel(result.stats.contentMode)}` : null,
      result.stats?.placementMode ? `Layout: ${formatLabel(result.stats.placementMode)}` : null,
      result.stats?.gridSize ? `Grid size: ${result.stats.gridSize} × ${result.stats.gridSize}` : null,
      result.stats?.correctObjectCount ? `Right objects: ${result.stats.correctObjectCount}` : null,
      result.stats?.figureSizePercent ? `Figure size: ${result.stats.figureSizePercent}%` : null,
      result.stats?.figureSizeMode ? `Size mode: ${formatLabel(result.stats.figureSizeMode)}` : null,
    ].filter(Boolean) as string[];
  }

  if (result.gameKey === "track-the-circle") {
    return [
      `Game: Track The Circle`,
      `Obtížnost: ${result.difficulty}`,
      result.stats?.swapCount ? `Přehození: ${result.stats.swapCount}` : null,
      result.stats?.swapDurationMs ? `Rychlost: ${result.stats.swapDurationMs}ms` : null,
      result.stats?.symbolSize ? `Symboly: ${result.stats.symbolSize}px` : null,
    ].filter(Boolean) as string[];
  }

  return [`Game: ${formatLabel(result.gameKey)}`];
}

function getSubtitle(result: GameResult): string {
  if (result.gameKey === "track-the-circle") {
    return result.success
      ? "Správně! Sledoval/a jsi cíl až do konce."
      : "Tentokrát to nevyšlo. Zkus to znovu.";
  }
  return result.success
    ? "You found all correct items. Here is a bigger overview of how the round went."
    : "The round has ended. Check the main results below and start another try.";
}

function getCorrectFoundLabel(result: GameResult): string {
  if (result.gameKey === "track-the-circle") {
    return result.success ? "✓" : "✗";
  }
  return result.stats
    ? `${result.stats.correctHits}/${result.maxScore}`
    : `${result.score}/${result.maxScore}`;
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

  const configPills = getConfigPills(result);
  const subtitle = getSubtitle(result);
  const correctFoundLabel = getCorrectFoundLabel(result);

  const accuracyLabel = result.stats ? `${result.stats.accuracyPercent}%` : "—";
  const correctTapsLabel = result.stats ? String(result.stats.correctHits) : String(result.score);
  const wrongLabel = result.stats ? String(result.stats.wrongHits) : "0";
  const elapsedLabel = result.stats ? `${result.stats.elapsedSeconds}s` : "—";

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.hero}>
          <div className={`${styles.badge} ${result.success ? styles.badgeSuccess : styles.badgeFail}`.trim()}>
            {result.success ? "You won" : "Try again"}
          </div>
          <h1 className={styles.title}>{result.success ? "Great job" : "Round finished"}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.summaryBlock}>
          <div>
            <span className={styles.summaryLabel}>
              {result.gameKey === "track-the-circle" ? "Výsledek" : "Correct found"}
            </span>
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

        {result.gameKey !== "track-the-circle" && (
          <div className={styles.statsGrid}>
            <StatCard label="Accuracy" value={accuracyLabel} />
            <StatCard label="Correct taps" value={correctTapsLabel} />
            <StatCard label="Wrong taps" value={wrongLabel} />
            <StatCard label="Time used" value={elapsedLabel} />
          </div>
        )}

        <div className={styles.actions}>
          <ButtonLink to={routes.games} variant="secondary" className={`${styles.actionButton} ${styles.actionButtonSecondary}`}>
            Home
          </ButtonLink>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionButtonSecondary}`}
          >
            Stáhnout PDF
          </button>
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