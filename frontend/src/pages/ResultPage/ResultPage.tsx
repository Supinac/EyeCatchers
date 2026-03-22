import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { routes } from "../../app/router/routes";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { formatTokenLabel, translateGameTitle, translateValue } from "../../app/i18n/text";
import type { GameResult } from "../../games/core/types/GameResult";
import styles from "./ResultPage.module.css";

function formatDuration(value: string | number | undefined) {
  if (value == null || value === "") return "—";
  return value === "unlimited" ? translateValue("unlimited") : `${value} s`;
}

function getConfigPills(result: GameResult, t: ReturnType<typeof useTranslation>["t"]): string[] {
  if (result.gameKey === "find-circle") {
    return [
      t("resultPage.pills.game", { value: translateGameTitle("find-circle") }),
      result.difficulty ? t("resultPage.pills.difficulty", { value: translateValue(result.difficulty) }) : null,
      result.stats?.previewSeconds != null ? t("resultPage.pills.previewTime", { value: `${result.stats.previewSeconds} s` }) : null,
      result.stats?.maxGameSeconds != null ? t("resultPage.pills.maxGameTime", { value: formatDuration(result.stats.maxGameSeconds) }) : null,
      result.stats?.contentMode ? t("resultPage.pills.contentMode", { value: formatTokenLabel(result.stats.contentMode) }) : null,
      result.stats?.placementMode ? t("resultPage.pills.placementMode", { value: formatTokenLabel(result.stats.placementMode) }) : null,
      result.stats?.gridSize ? t("resultPage.pills.gridSize", { value: `${result.stats.gridSize} × ${result.stats.gridSize}` }) : null,
      result.stats?.correctObjectCount ? t("resultPage.pills.correctObjectCount", { value: result.stats.correctObjectCount }) : null,
      result.stats?.figureSizePercent ? t("resultPage.pills.figureSizePercent", { value: `${result.stats.figureSizePercent}%` }) : null,
      result.stats?.figureSizeMode ? t("resultPage.pills.figureSizeMode", { value: formatTokenLabel(result.stats.figureSizeMode) }) : null,
    ].filter(Boolean) as string[];
  }

  if (result.gameKey === "track-the-circle") {
    return [
      t("resultPage.pills.game", { value: translateGameTitle("track-the-circle") }),
      result.difficulty ? t("resultPage.pills.difficulty", { value: translateValue(result.difficulty) }) : null,
      result.stats?.swapCount != null ? t("resultPage.pills.swapCount", { value: result.stats.swapCount }) : null,
      result.stats?.swapDurationMs != null ? t("resultPage.pills.swapDurationMs", { value: `${(result.stats.swapDurationMs / 1000).toFixed(1).replace(".", ",")} s` }) : null,
      result.stats?.symbolSize != null ? t("resultPage.pills.symbolSize", { value: `${result.stats.symbolSize} px` }) : null,
    ].filter(Boolean) as string[];
  }

  return [t("resultPage.pills.game", { value: translateGameTitle(result.gameKey) })];
}

function getSubtitle(result: GameResult, t: ReturnType<typeof useTranslation>["t"]): string {
  if (result.gameKey === "track-the-circle") {
    return result.success ? t("resultPage.subtitleTrackSuccess") : t("resultPage.subtitleTrackFail");
  }

  return result.success ? t("resultPage.subtitleFindCircleSuccess") : t("resultPage.subtitleFindCircleFail");
}

function getCorrectFoundLabel(result: GameResult): string {
  if (result.gameKey === "track-the-circle") {
    return result.success ? "✓" : "✗";
  }

  return result.stats ? `${result.stats.correctHits}/${result.maxScore}` : `${result.score}/${result.maxScore}`;
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
  const { t } = useTranslation();
  const result = (location.state as GameResult | undefined) ?? null;

  if (!result) {
    return (
      <main className={styles.page}>
        <section className={styles.panel}>
          <div className={styles.hero}>
            <div className={styles.badge}>{t("resultPage.emptyBadge")}</div>
            <h1 className={styles.title}>{t("resultPage.emptyTitle")}</h1>
            <p className={styles.subtitle}>{t("resultPage.emptySubtitle")}</p>
          </div>
          <div className={styles.actions}>
            <ButtonLink to={routes.games} variant="secondary" className={`${styles.actionButton} ${styles.actionButtonSecondary}`}>
              {t("resultPage.actions.backToGames")}
            </ButtonLink>
          </div>
        </section>
      </main>
    );
  }

  const configPills = getConfigPills(result, t);
  const subtitle = getSubtitle(result, t);
  const correctFoundLabel = getCorrectFoundLabel(result);

  const accuracyLabel = result.stats ? `${result.stats.accuracyPercent}%` : "—";
  const correctTapsLabel = result.stats ? String(result.stats.correctHits) : String(result.score);
  const wrongLabel = result.stats ? String(result.stats.wrongHits) : "0";
  const elapsedLabel = result.stats ? `${result.stats.elapsedSeconds} s` : "—";

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.hero}>
          <div className={`${styles.badge} ${result.success ? styles.badgeSuccess : styles.badgeFail}`.trim()}>
            {result.success ? t("resultPage.badgeSuccess") : t("resultPage.badgeFail")}
          </div>
          <h1 className={styles.title}>{result.success ? t("resultPage.titleSuccess") : t("resultPage.titleFail")}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.summaryBlock}>
          <div>
            <span className={styles.summaryLabel}>
              {result.gameKey === "track-the-circle" ? t("resultPage.summaryResult") : t("resultPage.summaryCorrectFound")}
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
            <StatCard label={t("resultPage.stats.accuracy")} value={accuracyLabel} />
            <StatCard label={t("resultPage.stats.correctTaps")} value={correctTapsLabel} />
            <StatCard label={t("resultPage.stats.wrongTaps")} value={wrongLabel} />
            <StatCard label={t("resultPage.stats.timeUsed")} value={elapsedLabel} />
          </div>
        )}

        <div className={styles.actions}>
          <ButtonLink to={routes.games} variant="secondary" className={`${styles.actionButton} ${styles.actionButtonSecondary}`}>
            {t("resultPage.actions.home")}
          </ButtonLink>
          {result.gameKey ? (
            <ButtonLink to={`/game/${result.gameKey}`} className={`${styles.actionButton} ${styles.actionButtonPrimary}`}>
              {t("resultPage.actions.playAgain")}
            </ButtonLink>
          ) : (
            <span />
          )}
        </div>
      </section>
    </main>
  );
}
