import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { routes } from "../../app/router/routes";
import { getGameByKey } from "../../api/gamesApi";
import type { GameCatalogItem } from "../../games/core/types/GameDefinition";
import type { ContentMode, FigureSizeMode, GridSize, MaxGameSeconds, PlacementMode, PreviewSeconds, SwapCount, SymbolSize, SwapDurationMs } from "../../games/core/types/GameConfig";
import { useGameSession } from "../../features/game-session/hooks/useGameSession";
import { defaultFindCircleConfig, getFigureSizePercent, getFindCircleCorrectCount, getMaxCorrectObjectCount } from "../../games/find-circle/FindCircleConfig";
import type { GameDifficulty } from "../../games/core/types/GameDefinition";
import { ConfigTileGroup, type TileOption } from "../../components/ui/ConfigTileGroup";
import { ConfigSlider } from "../../components/ui/ConfigSlider";
import styles from "./GameConfigPage.module.css";

const previewOptions: TileOption<PreviewSeconds>[] = [
  { id: 1, label: "1 sec", description: "Very quick flash." },
  { id: 2, label: "2 sec", description: "Short preview." },
  { id: 5, label: "5 sec", description: "Balanced time." },
  { id: 10, label: "10 sec", description: "Longest preview." },
];

const maxGameTimeOptions: TileOption<MaxGameSeconds>[] = [
  { id: 30, label: "30 sec", description: "Fast round." },
  { id: 60, label: "60 sec", description: "Standard." },
  { id: 90, label: "90 sec", description: "More time." },
  { id: "unlimited", label: "Unlimited", description: "No timer." },
];

const gridOptions: TileOption<GridSize>[] = [
  { id: 2, label: "2 × 2", description: "4 objects." },
  { id: 3, label: "3 × 3", description: "9 objects." },
  { id: 4, label: "4 × 4", description: "16 objects." },
  { id: 5, label: "5 × 5", description: "25 objects." },
];

const difficultyOptions: TileOption<GameDifficulty>[] = [
  { id: "easy", label: "Easy", description: "Fewer targets." },
  { id: "medium", label: "Medium", description: "Standard." },
  { id: "hard", label: "Hard", description: "More targets." },
];

export function GameConfigPage() {
  const { gameKey = "" } = useParams();
  const navigate = useNavigate();
  const { saveSessionState } = useGameSession();
  const [, setGame] = useState<GameCatalogItem | null>(null);

  // Stavy
  const [previewSeconds, setPreviewSeconds] = useState<PreviewSeconds>(defaultFindCircleConfig.previewSeconds);
  const [maxGameSeconds, setMaxGameSeconds] = useState<MaxGameSeconds>(defaultFindCircleConfig.maxGameSeconds);
  const [gridSize, setGridSize] = useState<GridSize>(defaultFindCircleConfig.gridSize);
  const [correctObjectCount, setCorrectObjectCount] = useState<number>(defaultFindCircleConfig.correctObjectCount);
  const [figureSizeMode, setFigureSizeMode] = useState<FigureSizeMode>(defaultFindCircleConfig.figureSizeMode);
  const [figureSizePercent, setFigureSizePercent] = useState<number>(defaultFindCircleConfig.figureSizePercent);
  const [contentMode, setContentMode] = useState<ContentMode>(defaultFindCircleConfig.contentMode);
  const [placementMode, setPlacementMode] = useState<PlacementMode>(defaultFindCircleConfig.placementMode);
  const [difficulty, setDifficulty] = useState<GameDifficulty>("easy");
  const [keysGridSize, setKeysGridSize] = useState<GridSize>(3);
  const [requiredMatches, setRequiredMatches] = useState<number>(2);
  const [rotationEnabled, setRotationEnabled] = useState<string>("true");
  const [mirroringEnabled, setMirroringEnabled] = useState<string>("true");
  const [scaleVariation, setScaleVariation] = useState<number>(20);

  useEffect(() => { void getGameByKey(gameKey).then(setGame); }, [gameKey]);

  const handleStart = () => {
    const params = new URLSearchParams({ 
        difficulty,
        grid: String(gameKey === "keys" ? keysGridSize : gridSize),
        rot: rotationEnabled,
        mir: mirroringEnabled,
        scale: String(scaleVariation),
        matches: String(requiredMatches),
        maxTime: String(maxGameSeconds)
    });

    saveSessionState({
      gameKey,
      difficulty,
      keys: {
        gridSize: keysGridSize,
        requiredMatches,
        rotationEnabled: rotationEnabled === "true",
        mirroringEnabled: mirroringEnabled === "true",
        scaleVariation: scaleVariation / 100,
        maxGameSeconds,
        distractorTeethPool: []
      }
    });

    navigate(routes.gamePlay.replace(":gameKey", gameKey) + `?${params.toString()}`);
  };

  return (
    <main className={styles.page}>
      <button type="button" onClick={() => navigate(routes.games)} className={styles.backButton}><span>Back</span></button>
      <div className={styles.panel}>
        {gameKey === "keys" && (
          <>
            <ConfigTileGroup title="Grid size" options={gridOptions} selected={keysGridSize} onChange={setKeysGridSize} />
            <ConfigSlider title="Required matches" min={2} max={keysGridSize * keysGridSize - 1} step={1} value={requiredMatches} onChange={setRequiredMatches} />
            <ConfigTileGroup 
                title="Rotation" 
                options={[
                    { id: "true", label: "On", description: "Random rotation." },
                    { id: "false", label: "Off", description: "Fixed." }
                ]} 
                selected={rotationEnabled} 
                onChange={setRotationEnabled} 
            />
            <ConfigTileGroup 
                title="Mirroring" 
                options={[
                    { id: "true", label: "On", description: "Random mirroring." },
                    { id: "false", label: "Off", description: "Fixed." }
                ]} 
                selected={mirroringEnabled} 
                onChange={setMirroringEnabled} 
            />
            <ConfigSlider title="Scale variation" min={0} max={100} step={5} value={scaleVariation} onChange={setScaleVariation} formatValue={(v: number) => `±${v}%`} />
          </>
        )}
      </div>
      <button type="button" onClick={handleStart} className={styles.startButton}>Start Game</button>
    </main>
  );
}