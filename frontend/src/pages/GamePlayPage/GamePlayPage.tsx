import { useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { saveSessionResult } from "../../api/sessionsApi";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { PixiGameHost } from "../../games/pixi/PixiGameHost";
import type { GameDifficulty } from "../../games/core/types/GameDefinition";
import type { GameResult } from "../../games/core/types/GameResult";
import type { GameConfig } from "../../games/core/types/GameConfig";
import {
  getContentMode,
  getFigureSizeMode,
  getFigureSizePercent,
  getFindCircleCorrectCount,
  getGridSize,
  getMaxGameSeconds,
  getPlacementMode,
  getPreviewSeconds,
  isUnlimitedTime,
} from "../../games/find-circle/FindCircleConfig";
import { formatTokenLabel, translateValue } from "../../app/i18n/text";
import styles from "./GamePlayPage.module.css";

export function GamePlayPage() {
  const { gameKey = "find-circle" } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const difficulty = ((searchParams.get("difficulty") as GameDifficulty) || "easy") as GameDifficulty;

  const config = useMemo<GameConfig>(() => {
    const preview = getPreviewSeconds(searchParams.get("preview"));
    const maxTime = getMaxGameSeconds(searchParams.get("maxTime"));
    const grid = getGridSize(searchParams.get("grid"));
    const sizeMode = getFigureSizeMode(searchParams.get("sizeMode"));
    const sizePercent = getFigureSizePercent(searchParams.get("sizePercent"));
    const contentMode = getContentMode(searchParams.get("contentMode"));
    const placementMode = getPlacementMode(searchParams.get("placementMode"));
    const correctCount = getFindCircleCorrectCount(grid, Number(searchParams.get("correctCount")) || undefined);

    return {
      gameKey,
      difficulty,
      findCircle: {
        previewSeconds: preview,
        maxGameSeconds: maxTime,
        gridSize: grid,
        correctObjectCount: correctCount,
        figureSizeMode: sizeMode,
        figureSizePercent: sizePercent,
        contentMode,
        placementMode,
      },
    };
  }, [difficulty, gameKey, searchParams]);

  const handleComplete = useCallback(
    async (result: GameResult) => {
      await saveSessionResult(result);
      navigate("/result", { state: result });
    },
    [navigate],
  );

  return (
    <main className={styles.page}>
      <div className={styles.topBar}>
        <ButtonLink to={`/game/${gameKey}`} variant="ghost">
          {t("config.back")}
        </ButtonLink>
        <div className={styles.meta}>
          {gameKey === "find-circle" && (
            <>
              <span>{t("config.meta.previewTime", { value: `${config.findCircle?.previewSeconds} s` })}</span>
              <span>
                {isUnlimitedTime(config.findCircle?.maxGameSeconds ?? 60)
                  ? t("config.meta.maxGameTimeUnlimited")
                  : t("config.meta.maxGameTimeLimited", { value: `${config.findCircle?.maxGameSeconds} s` })}
              </span>
              <span>{t("config.meta.gridSize", { value: `${config.findCircle?.gridSize}×${config.findCircle?.gridSize}` })}</span>
              <span>{t("config.meta.correctObjectCount", { value: config.findCircle?.correctObjectCount })}</span>
              <span>{formatTokenLabel(config.findCircle?.contentMode)}</span>
              <span>{formatTokenLabel(config.findCircle?.placementMode)}</span>
              <span>{t("config.meta.figureSizePercent", { value: `${config.findCircle?.figureSizePercent}%`, mode: formatTokenLabel(config.findCircle?.figureSizeMode).toLowerCase() })}</span>
            </>
          )}
          {gameKey === "track-the-circle" && (
            <>
              <span>{translateValue(difficulty)}</span>
              <span>{t("config.meta.swapCount", { value: searchParams.get("swapCount") })}</span>
              <span>{t("config.meta.swapDurationMs", { value: `${searchParams.get("swapDurationMs")} ms` })}</span>
              <span>{t("config.meta.symbolSize", { value: `${searchParams.get("symbolSize")} px` })}</span>
            </>
          )}
        </div>
      </div>

      <section className={styles.stage}>
        <PixiGameHost gameKey={gameKey} difficulty={difficulty} config={config} onComplete={handleComplete} />
      </section>
    </main>
  );
}
