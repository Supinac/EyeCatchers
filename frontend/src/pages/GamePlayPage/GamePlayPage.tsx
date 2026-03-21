import { useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import styles from "./GamePlayPage.module.css";

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

export function GamePlayPage() {
  const { gameKey = "find-circle" } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
          Back
        </ButtonLink>
        <div className={styles.meta}>
          {gameKey === "find-circle" && (
            <>
              <span>{config.findCircle?.previewSeconds}s preview</span>
              <span>{isUnlimitedTime(config.findCircle?.maxGameSeconds ?? 60) ? "Unlimited time" : `${config.findCircle?.maxGameSeconds}s max time`}</span>
              <span>{config.findCircle?.gridSize}×{config.findCircle?.gridSize} items</span>
              <span>{config.findCircle?.correctObjectCount} correct</span>
              <span>{formatLabel(config.findCircle?.contentMode)}</span>
              <span>{formatLabel(config.findCircle?.placementMode)}</span>
              <span>{config.findCircle?.figureSizePercent}% {formatLabel(config.findCircle?.figureSizeMode).toLowerCase()} size</span>
            </>
          )}
          {gameKey === "track-the-circle" && (
            <>
              <span>{difficulty}</span>
              <span>{searchParams.get("swapCount")} přehození</span>
              <span>{searchParams.get("symbolSize")}px symboly</span>
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
