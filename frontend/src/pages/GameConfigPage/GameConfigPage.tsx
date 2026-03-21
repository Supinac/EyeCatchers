import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { routes } from "../../app/router/routes";
import { getGameByKey } from "../../api/gamesApi";
import type { GameCatalogItem } from "../../games/core/types/GameDefinition";
import type { FigureSizeMode, GridSize, MaxGameSeconds, PreviewSeconds, SwapCount, SymbolSize } from "../../games/core/types/GameConfig";
import { useGameSession } from "../../features/game-session/hooks/useGameSession";
import { ArcadeIcon, PuzzleIcon, StrategyIcon } from "../../features/game-catalog/components/GameIcons";
import { defaultFindCircleConfig } from "../../games/find-circle/FindCircleConfig";
import styles from "./GameConfigPage.module.css";
import type { GameDifficulty } from "../../games/core/types/GameDefinition";

type ConfigOption<T extends string | number> = {
  id: T;
  label: string;
  description: string;
};

const previewOptions: ConfigOption<PreviewSeconds>[] = [
  { id: 5, label: "5 sec", description: "Quick preview before the grid appears." },
  { id: 10, label: "10 sec", description: "Balanced memory time." },
  { id: 15, label: "15 sec", description: "More time to look carefully." },
  { id: 20, label: "20 sec", description: "Longest and calmest preview." },
];

const maxGameTimeOptions: ConfigOption<MaxGameSeconds>[] = [
  { id: 30, label: "30 sec", description: "Fast round with quick decisions." },
  { id: 60, label: "60 sec", description: "Balanced time for most players." },
  { id: 90, label: "90 sec", description: "More time for larger grids." },
  { id: 120, label: "120 sec", description: "Longest and calmest game timer." },
];

const gridOptions: ConfigOption<GridSize>[] = [
  { id: 2, label: "2 × 2", description: "4 objects on screen." },
  { id: 3, label: "3 × 3", description: "9 objects on screen." },
  { id: 4, label: "4 × 4", description: "16 objects on screen." },
  { id: 5, label: "5 × 5", description: "25 objects on screen." },
];

const figureSizeOptions: ConfigOption<FigureSizeMode>[] = [
  { id: "static", label: "Static", description: "All figures keep the same size." },
  { id: "random", label: "Random", description: "Figure sizes vary in the grid." },
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

function getGameIcon(gameKey: string) {
  if (gameKey === "memory-pairs") return <StrategyIcon className={styles.gameIcon} />;
  if (gameKey === "shape-match") return <ArcadeIcon className={styles.gameIcon} />;
  return <PuzzleIcon className={styles.gameIcon} />;
}

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
  const [game, setGame] = useState<GameCatalogItem | null>(null);
  const [previewSeconds, setPreviewSeconds] = useState<PreviewSeconds>(defaultFindCircleConfig.previewSeconds);
  const [maxGameSeconds, setMaxGameSeconds] = useState<MaxGameSeconds>(defaultFindCircleConfig.maxGameSeconds);
  const [gridSize, setGridSize] = useState<GridSize>(defaultFindCircleConfig.gridSize);
  const [figureSizeMode, setFigureSizeMode] = useState<FigureSizeMode>(defaultFindCircleConfig.figureSizeMode);
  const [swapCount, setSwapCount] = useState<SwapCount>(15);
  const [difficulty, setDifficulty] = useState<GameDifficulty>("easy");
  const [symbolSize, setSymbolSize] = useState<SymbolSize>(52);

  useEffect(() => {
    void getGameByKey(gameKey).then(setGame);
  }, [gameKey]);

  function handleStart() {
    saveSessionState({
      gameKey,
      difficulty,
      findCircle: { previewSeconds, maxGameSeconds, gridSize, figureSizeMode },
      trackTheCircle: { swapCount, symbolSize },
    });

    const params = new URLSearchParams({
      preview: String(previewSeconds),
      maxTime: String(maxGameSeconds),
      grid: String(gridSize),
      sizeMode: figureSizeMode,
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
        <h1 className={styles.title}>{"Configuration"}</h1>
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
                  <ConfigTile key={option.id} option={option} selected={maxGameSeconds === option.id} onClick={() => setMaxGameSeconds(option.id)} />
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
              <h2 className={styles.sectionTitle}>Figure size</h2>
              <div className={styles.grid}>
                {figureSizeOptions.map((option) => (
                  <ConfigTile key={option.id} option={option} selected={figureSizeMode === option.id} onClick={() => setFigureSizeMode(option.id)} />
                ))}
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
                    <span style={{ fontSize: symbolSize, color: "#fff", lineHeight: 1, fontFamily: "Arial", fontWeight: "bold" }}>
                      3
                    </span>
                    <span style={{ fontSize: symbolSize, color: "#fff", lineHeight: 1, fontFamily: "Arial", fontWeight: "bold" }}>
                      A
                    </span>
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