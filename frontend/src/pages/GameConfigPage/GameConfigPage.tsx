import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { routes } from "../../app/router/routes";
import { getGameByKey } from "../../api/gamesApi";
import type { GameCatalogItem } from "../../games/core/types/GameDefinition";
import type { ContentMode, FigureSizeMode, GridSize, MaxGameSeconds, PlacementMode, PreviewSeconds, SwapCount, SymbolSize } from "../../games/core/types/GameConfig";
import { useGameSession } from "../../features/game-session/hooks/useGameSession";
import { defaultFindCircleConfig, getFigureSizePercent, getFindCircleCorrectCount, getMaxCorrectObjectCount } from "../../games/find-circle/FindCircleConfig";
import type { GameDifficulty } from "../../games/core/types/GameDefinition";
import { ConfigTileGroup, type TileOption } from "../../components/ui/ConfigTileGroup";
import { ConfigSlider } from "../../components/ui/ConfigSlider";
import styles from "./GameConfigPage.module.css";

const previewOptions: TileOption<PreviewSeconds>[] = [
  { id: 1, label: "1 sec", description: "Very quick flash before the game starts." },
  { id: 2, label: "2 sec", description: "Short preview for a harder round." },
  { id: 5, label: "5 sec", description: "Balanced memory time." },
  { id: 10, label: "10 sec", description: "Longest and calmest preview." },
];

const maxGameTimeOptions: TileOption<MaxGameSeconds>[] = [
  { id: 30, label: "30 sec", description: "Fast round with quick decisions." },
  { id: 60, label: "60 sec", description: "Balanced time for most players." },
  { id: 90, label: "90 sec", description: "More time for larger grids." },
  { id: "unlimited", label: "Unlimited", description: "No timer. The round ends only when all correct items are found." },
];

const gridOptions: TileOption<GridSize>[] = [
  { id: 2, label: "2 × 2", description: "4 objects on screen." },
  { id: 3, label: "3 × 3", description: "9 objects on screen." },
  { id: 4, label: "4 × 4", description: "16 objects on screen." },
  { id: 5, label: "5 × 5", description: "25 objects on screen." },
];

const contentOptions: TileOption<ContentMode>[] = [
  { id: "figures", label: "Figures", description: "Circle, rectangle, triangle and other simple icons." },
  { id: "letters", label: "Czech letters", description: "Big bold Czech uppercase letters for kids." },
  { id: "numbers", label: "Numbers", description: "Big bold digits from 0 to 9." },
];

const placementOptions: TileOption<PlacementMode>[] = [
  { id: "grid", label: "Grid", description: "Objects are placed into a clean grid." },
  { id: "random", label: "Random positions", description: "Objects are scattered across the whole view." },
];

const figureSizeOptions: TileOption<FigureSizeMode>[] = [
  { id: "fixed", label: "Fixed", description: "All objects keep the same size percent." },
  { id: "random", label: "Random", description: "Objects still use your chosen size, but some become smaller or bigger." },
];

const swapCountOptions: TileOption<SwapCount>[] = [
  { id: 5,  label: "5",  description: "Velmi jednoduché." },
  { id: 10, label: "10", description: "Lehká úroveň." },
  { id: 15, label: "15", description: "Střední obtížnost." },
  { id: 20, label: "20", description: "Náročnější sledování." },
  { id: 25, label: "25", description: "Těžké." },
  { id: 30, label: "30", description: "Maximální obtížnost." },
];

const difficultyOptions: TileOption<GameDifficulty>[] = [
  { id: "easy",   label: "Lehká",   description: "3 kruhy na obrazovce." },
  { id: "medium", label: "Střední", description: "5 kruhů na obrazovce." },
  { id: "hard",   label: "Těžká",   description: "8 kruhů na obrazovce." },
];

export function GameConfigPage() {
  const { gameKey = "" } = useParams();
  const navigate = useNavigate();
  const { saveSessionState } = useGameSession();
  const [, setGame] = useState<GameCatalogItem | null>(null);

  const [previewSeconds, setPreviewSeconds] = useState<PreviewSeconds>(defaultFindCircleConfig.previewSeconds);
  const [maxGameSeconds, setMaxGameSeconds] = useState<MaxGameSeconds>(defaultFindCircleConfig.maxGameSeconds);
  const [gridSize, setGridSize] = useState<GridSize>(defaultFindCircleConfig.gridSize);
  const [correctObjectCount, setCorrectObjectCount] = useState<number>(defaultFindCircleConfig.correctObjectCount);
  const [figureSizeMode, setFigureSizeMode] = useState<FigureSizeMode>(defaultFindCircleConfig.figureSizeMode);
  const [figureSizePercent, setFigureSizePercent] = useState<number>(defaultFindCircleConfig.figureSizePercent);
  const [contentMode, setContentMode] = useState<ContentMode>(defaultFindCircleConfig.contentMode);
  const [placementMode, setPlacementMode] = useState<PlacementMode>(defaultFindCircleConfig.placementMode);
  const [swapCount, setSwapCount] = useState<SwapCount>(15);
  const [difficulty, setDifficulty] = useState<GameDifficulty>("easy");
  const [symbolSize, setSymbolSize] = useState<SymbolSize>(52);

  useEffect(() => {
    void getGameByKey(gameKey).then(setGame);
  }, [gameKey]);

  const maxCorrectObjectCount = useMemo(() => getMaxCorrectObjectCount(gridSize), [gridSize]);

  useEffect(() => {
    setCorrectObjectCount((current) => getFindCircleCorrectCount(gridSize, current));
  }, [gridSize]);

  function handleStart() {
    saveSessionState({
      gameKey,
      difficulty,
      findCircle: { previewSeconds, maxGameSeconds, gridSize, correctObjectCount, figureSizeMode, figureSizePercent, contentMode, placementMode },
      trackTheCircle: { swapCount, symbolSize },
    });

    const params = new URLSearchParams({
      preview: String(previewSeconds),
      maxTime: String(maxGameSeconds),
      grid: String(gridSize),
      correctCount: String(correctObjectCount),
      sizeMode: figureSizeMode,
      sizePercent: String(figureSizePercent),
      contentMode,
      placementMode,
      swapCount: String(swapCount),
      symbolSize: String(symbolSize),
      difficulty,
    });

    navigate(`/play/${gameKey}?${params.toString()}`);
  }

  return (
    <main className={styles.page}>
      <button type="button" onClick={() => navigate(routes.games)} className={styles.backButton}>
        <svg className={styles.backArrow} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Back</span>
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>Configuration</h1>
      </div>

      <div className={styles.panel}>
        {gameKey === "find-circle" && (
          <>
            <ConfigTileGroup title="Preview time" options={previewOptions} selected={previewSeconds} onChange={setPreviewSeconds} />
            <ConfigTileGroup title="Max game time" options={maxGameTimeOptions} selected={maxGameSeconds} onChange={setMaxGameSeconds} />
            <ConfigTileGroup title="Grid size" options={gridOptions} selected={gridSize} onChange={setGridSize} />
            <ConfigSlider
              title="Right objects count"
              hint="Choose how many correct items will appear on the screen."
              min={1}
              max={maxCorrectObjectCount}
              step={1}
              value={correctObjectCount}
              onChange={(v) => setCorrectObjectCount(getFindCircleCorrectCount(gridSize, v))}
            />
            <ConfigTileGroup title="Content mode" options={contentOptions} selected={contentMode} onChange={setContentMode} />
            <ConfigTileGroup title="Placement mode" options={placementOptions} selected={placementMode} onChange={setPlacementMode} />
            <ConfigTileGroup title="Figure size mode" options={figureSizeOptions} selected={figureSizeMode} onChange={setFigureSizeMode} />
            <ConfigSlider
              title="Figure size"
              hint="100% fills almost the whole available object area. 50% makes it about half that size."
              min={40}
              max={100}
              step={5}
              value={figureSizePercent}
              onChange={(v) => setFigureSizePercent(getFigureSizePercent(v))}
              formatValue={(v) => `${v}%`}
            />
          </>
        )}

        {gameKey === "track-the-circle" && (
          <>
            <ConfigTileGroup title="Obtížnost" options={difficultyOptions} selected={difficulty} onChange={setDifficulty} />
            <ConfigTileGroup title="Počet přehození" options={swapCountOptions} selected={swapCount} onChange={setSwapCount} />
            <ConfigSlider
              title="Velikost symbolů"
              min={32}
              max={144}
              step={4}
              value={symbolSize}
              onChange={(v) => setSymbolSize(v as SymbolSize)}
            >
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 32, marginTop: 24, height: 144, overflow: "hidden" }}>
                <span style={{ fontSize: symbolSize, color: "#fff", fontFamily: "Arial", fontWeight: "bold", lineHeight: 1 }}>3</span>
                <span style={{ fontSize: symbolSize, color: "#fff", fontFamily: "Arial", fontWeight: "bold", lineHeight: 1 }}>A</span>
                <svg width={symbolSize} height={symbolSize} viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
                  <rect x="10" y="10" width="80" height="80" fill="#fff" />
                </svg>
              </div>
            </ConfigSlider>
          </>
        )}
      </div>

      <button type="button" onClick={handleStart} className={styles.startButton}>
        Start Game
      </button>
    </main>
  );
}