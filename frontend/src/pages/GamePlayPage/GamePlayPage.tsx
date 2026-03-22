import { useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { saveSessionResult } from "../../api/sessionsApi";
import { ButtonLink } from "../../components/ui/ButtonLink";
import { PixiGameHost } from "../../games/pixi/PixiGameHost";
import type { GameResult } from "../../games/core/types/GameResult";
import type { GameConfig } from "../../games/core/types/GameConfig";
import {
  getFigureSizePercent,
  getFindCircleCorrectCount,
  getGridSize,
  getMaxGameSeconds,
  getPreviewSeconds,
} from "../../games/find-circle/FindCircleConfig";
import styles from "./GamePlayPage.module.css";

export function GamePlayPage() {
  const { gameKey = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleComplete = useCallback(async (result: GameResult) => {
    await saveSessionResult(result);
    navigate("/result");
  }, [navigate]);

  const config = useMemo<GameConfig>(() => {
    const getBool = (key: string) => searchParams.get(key) === "true";
    const grid = (Number(searchParams.get("grid")) || 3) as any;

    return {
      gameKey,
      difficulty: (searchParams.get("difficulty") as any) || "easy",
      // FindCircle data musí být přítomna pro typovou shodu
      findCircle: {
        previewSeconds: getPreviewSeconds(searchParams.get("preview")),
        maxGameSeconds: getMaxGameSeconds(searchParams.get("maxTime")),
        gridSize: grid,
        correctObjectCount: getFindCircleCorrectCount(grid, Number(searchParams.get("matches"))),
        figureSizeMode: "fixed",
        figureSizePercent: getFigureSizePercent(searchParams.get("scale")),
        contentMode: "figures",
        placementMode: "grid",
      },
      keys: gameKey === "keys" ? {
        gridSize: grid,
        requiredMatches: Number(searchParams.get("matches")) || 2,
        rotationEnabled: getBool("rot"),
        mirroringEnabled: getBool("mir"),
        scaleVariation: (Number(searchParams.get("scale")) || 0) / 100,
        maxGameSeconds: getMaxGameSeconds(searchParams.get("maxTime")),
        distractorTeethPool: [],
      } : undefined,
    } as GameConfig;
  }, [gameKey, searchParams]);

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <ButtonLink to={`/game/${gameKey}`} variant="ghost">Back</ButtonLink>
      </div>
      <section className={styles.stage}>
        <PixiGameHost gameKey={gameKey} difficulty={config.difficulty} config={config} onComplete={handleComplete} />
      </section>
    </main>
  );
}