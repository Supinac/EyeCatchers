import { useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { saveSessionResult } from "../../api/sessionsApi";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { PixiGameHost } from "../../games/pixi/PixiGameHost";
import type { GameDifficulty } from "../../games/core/types/GameDefinition";
import type { GameResult } from "../../games/core/types/GameResult";
import type { GameConfig } from "../../games/core/types/GameConfig";
import { getFigureSizeMode, getGridSize, getMaxGameSeconds, getPreviewSeconds } from "../../games/find-circle/FindCircleConfig";
import styles from "./GamePlayPage.module.css";

export function GamePlayPage() {
  const { gameKey = "find-circle" } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const difficulty = ((searchParams.get("difficulty") as GameDifficulty) || "easy") as GameDifficulty;

  const config = useMemo<GameConfig>(() => {
    const preview = getPreviewSeconds(Number(searchParams.get("preview")) || undefined);
    const maxTime = getMaxGameSeconds(Number(searchParams.get("maxTime")) || undefined);
    const grid = getGridSize(Number(searchParams.get("grid")) || undefined);
    const sizeMode = getFigureSizeMode(searchParams.get("sizeMode"));

    return {
      gameKey,
      difficulty,
      findCircle: {
        previewSeconds: preview,
        maxGameSeconds: maxTime,
        gridSize: grid,
        figureSizeMode: sizeMode,
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
          <span>{config.findCircle?.previewSeconds}s preview</span>
          <span>{config.findCircle?.maxGameSeconds}s max time</span>
          <span>{config.findCircle?.gridSize}×{config.findCircle?.gridSize} grid</span>
          <span>{config.findCircle?.figureSizeMode} figures</span>
        </div>
      </div>

      <section className={styles.stage}>
        <PixiGameHost gameKey={gameKey} difficulty={difficulty} config={config} onComplete={handleComplete} />
      </section>
    </main>
  );
}
