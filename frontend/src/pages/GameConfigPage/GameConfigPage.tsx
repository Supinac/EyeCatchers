import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { routes } from "../../app/router/routes";
import { getGameByKey } from "../../api/gamesApi";
import type { GameCatalogItem } from "../../games/core/types/GameDefinition";
import type { ContentMode, FigureSizeMode, GridSize, MaxGameSeconds, PlacementMode, PreviewSeconds, SwapCount, SymbolSize } from "../../games/core/types/GameConfig";
import { useGameSession } from "../../features/game-session/hooks/useGameSession";
import {
  defaultFindCircleConfig,
  getFigureSizePercent,
  getFindCircleCorrectCount,
  getMaxCorrectObjectCount,
} from "../../games/find-circle/FindCircleConfig";
import styles from "./GameConfigPage.module.css";
import type { GameDifficulty } from "../../games/core/types/GameDefinition";

type ConfigOption<T extends string | number> = {
  id: T;
  label: string;
  description: string;
};

const previewOptions: ConfigOption<PreviewSeconds>[] = [
  { id: 1, label: "1 sec", description: "Very quick flash before the game starts." },
  { id: 2, label: "2 sec", description: "Short preview for a harder round." },
  { id: 5, label: "5 sec", description: "Balanced memory time." },
  { id: 10, label: "10 sec", description: "Longest and calmest preview." },
];

const maxGameTimeOptions: ConfigOption<MaxGameSeconds>[] = [
  { id: 30, label: "30 sec", description: "Fast round with quick decisions." },
  { id: 60, label: "60 sec", description: "Balanced time for most players." },
  { id: 90, label: "90 sec", description: "More time for larger grids." },
  { id: "unlimited", label: "Unlimited", description: "No timer. The round ends only when all correct items are found." },
];

const gridOptions: ConfigOption<GridSize>[] = [
  { id: 2, label: "2 × 2", description: "4 objects on screen." },
  { id: 3, label: "3 × 3", description: "9 objects on screen." },
  { id: 4, label: "4 × 4", description: "16 objects on screen." },
  { id: 5, label: "5 × 5", description: "25 objects on screen." },
];

const contentOptions: ConfigOption<ContentMode>[] = [
  { id: "figures", label: "Figures", description: "Circle, rectangle, triangle and other simple icons." },
  { id: "letters", label: "Czech letters", description: "Big bold Czech uppercase letters for kids." },
  { id: "numbers", label: "Numbers", description: "Big bold digits from 0 to 9." },
];

const placementOptions: ConfigOption<PlacementMode>[] = [
  { id: "grid", label: "Grid", description: "Objects are placed into a clean grid." },
  { id: "random", label: "Random positions", description: "Objects are scattered across the whole view." },
];

const figureSizeOptions: ConfigOption<FigureSizeMode>[] = [
  { id: "fixed", label: "Fixed", description: "All objects keep the same size percent." },
  { id: "random", label: "Random", description: "Objects still use your chosen size, but some become smaller or bigger." },
];

const swapCountOptions: ConfigOption<SwapCount>[] = [
  { id: 5,  label: "5",  description: "Velmi jednoduché." },
  { id: 10, label: "10", description: "Lehká úroveň." },
  { id: 15, label: "15", description: "Střední obtížnost." },
  { id: 20, label: "20", description: "Náročnější sledování." },
  { id: 25, label: "25", description: "Těžké." },
  { id: 30, label: "30", description: "Maximální obtížnost." },
];

const difficultyOptions: ConfigOption<GameDifficulty>[] = [
  { id: "easy",   label: "Lehká",   description: "3 kruhy na obrazovce." },
  { id: "medium", label: "Střední", description: "5 kruhů na obrazovce." },
  { id: "hard",   label: "Těžká",   description: "8 kruhů na obrazovce." },
];

function ConfigTile<T extends string | number>({
  option,
  selected,
  onClick,
}: {
  option: ConfigOption<T>;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.tile} ${selected ? styles.tileSelected : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className={styles.tileLabel}>{option.label}</span>
      <span className={styles.tileDescription}>{option.description}</span>
    </button>
  );
}

export function GameConfigPage() {
  const { gameKey = "" } = useParams();
  const navigate = useNavigate();
  const { saveSessionState } = useGameSession();
  const [, setGame] = useState<GameCatalogItem | null>(null);

  // find-circle state
  const [previewSeconds, setPreviewSeconds] = useState<PreviewSeconds>(defaultFindCircleConfig.previewSeconds);
  const [maxGameSeconds, setMaxGameSeconds] = useState<MaxGameSeconds>(defaultFindCircleConfig.maxGameSeconds);
  const [gridSize, setGridSize] = useState<GridSize>(defaultFindCircleConfig.gridSize);
  const [correctObjectCount, setCorrectObjectCount] = useState<number>(defaultFindCircleConfig.correctObjectCount);
  const [figureSizeMode, setFigureSizeMode] = useState<FigureSizeMode>(defaultFindCircleConfig.figureSizeMode);
  const [figureSizePercent, setFigureSizePercent] = useState<number>(defaultFindCircleConfig.figureSizePercent);
  const [contentMode, setContentMode] = useState<ContentMode>(defaultFindCircleConfig.contentMode);
  const [placementMode, setPlacementMode] = useState<PlacementMode>(defaultFindCircleConfig.placementMode);

  // track-the-circle state
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
      findCircle: {
        previewSeconds,
        maxGameSeconds,
        gridSize,
        correctObjectCount,
        figureSizeMode,
        figureSizePercent,
        contentMode,
        placementMode,
      },
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

  function handleBack() {
    navigate(routes.games);
  }

  return (
    <main className={styles.page}>
      <button type="button" onClick={handleBack} className={styles.backButton}>
        <svg className={styles.backArrow} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Back</span>
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>Configuration</h1>
      </div>

      <div className={styles.panel}>
        {gameKey !== "track-the-circle" && (
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Preview time</h2>
              <div className={styles.grid}>
                {previewOptions.map((option) => (
                  <ConfigTile key={option.id} option={option} selected={previewSeconds === option.id} onClick={() => setPreviewSeconds(option.id)} />
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Max game time</h2>
              <div className={styles.grid}>
                {maxGameTimeOptions.map((option) => (
                  <ConfigTile key={String(option.id)} option={option} selected={maxGameSeconds === option.id} onClick={() => setMaxGameSeconds(option.id)} />
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Grid size</h2>
              <div className={styles.grid}>
                {gridOptions.map((option) => (
                  <ConfigTile key={option.id} option={option} selected={gridSize === option.id} onClick={() => setGridSize(option.id)} />
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sliderHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Right objects count</h2>
                  <p className={styles.sliderHint}>Choose how many correct items will appear on the screen.</p>
                </div>
                <div className={styles.sliderValue}>{correctObjectCount}</div>
              </div>
              <div className={styles.sliderPanel}>
                <input
                  className={styles.slider}
                  type="range"
                  min={1}
                  max={maxCorrectObjectCount}
                  step={1}
                  value={correctObjectCount}
                  onChange={(e) => setCorrectObjectCount(getFindCircleCorrectCount(gridSize, Number(e.target.value)))}
                />
                <div className={styles.sliderScale}>
                  <span>1</span>
                  <span>{maxCorrectObjectCount}</span>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Content mode</h2>
              <div className={styles.grid}>
                {contentOptions.map((option) => (
                  <ConfigTile key={option.id} option={option} selected={contentMode === option.id} onClick={() => setContentMode(option.id)} />
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Placement mode</h2>
              <div className={styles.grid}>
                {placementOptions.map((option) => (
                  <ConfigTile key={option.id} option={option} selected={placementMode === option.id} onClick={() => setPlacementMode(option.id)} />
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Figure size mode</h2>
              <div className={styles.grid}>
                {figureSizeOptions.map((option) => (
                  <ConfigTile key={option.id} option={option} selected={figureSizeMode === option.id} onClick={() => setFigureSizeMode(option.id)} />
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sliderHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Figure size</h2>
                  <p className={styles.sliderHint}>100% fills almost the whole available object area. 50% makes it about half that size.</p>
                </div>
                <div className={styles.sliderValue}>{figureSizePercent}%</div>
              </div>
              <div className={styles.sliderPanel}>
                <input
                  className={styles.slider}
                  type="range"
                  min={40}
                  max={100}
                  step={5}
                  value={figureSizePercent}
                  onChange={(e) => setFigureSizePercent(getFigureSizePercent(e.target.value))}
                />
                <div className={styles.sliderScale}>
                  <span>40%</span>
                  <span>100%</span>
                </div>
              </div>
            </section>
          </>
        )}

        {gameKey === "track-the-circle" && (
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Obtížnost</h2>
              <div className={styles.grid}>
                {difficultyOptions.map((option) => (
                  <ConfigTile key={option.id} option={option} selected={difficulty === option.id} onClick={() => setDifficulty(option.id)} />
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Počet přehození</h2>
              <div className={styles.grid}>
                {swapCountOptions.map((option) => (
                  <ConfigTile key={option.id} option={option} selected={swapCount === option.id} onClick={() => setSwapCount(option.id)} />
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Velikost symbolů</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                <input
                  type="range"
                  min={32}
                  max={144}
                  step={4}
                  value={symbolSize}
                  onChange={(e) => setSymbolSize(Number(e.target.value) as SymbolSize)}
                  style={{ flex: 6, accentColor: "#fff", height: 6 }}
                />
                <div style={{ flex: 4, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 24, height: 144, overflow: "hidden" }}>
                  <span style={{ fontSize: symbolSize, color: "#fff", lineHeight: 1, fontFamily: "Arial", fontWeight: "bold" }}>3</span>
                  <span style={{ fontSize: symbolSize, color: "#fff", lineHeight: 1, fontFamily: "Arial", fontWeight: "bold" }}>A</span>
                  <svg width={symbolSize} height={symbolSize} viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
                    <rect x="10" y="10" width="80" height="80" fill="#fff" />
                  </svg>
                </div>
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 6 }}>
                Velikost: {symbolSize}px
              </div>
            </section>
          </>
        )}
      </div>

      <button type="button" onClick={handleStart} className={styles.startButton}>
        Start Game
      </button>
    </main>
  );
}