import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { routes } from "../../app/router/routes";
import { getGameByKey } from "../../api/gamesApi";
import type { GameCatalogItem } from "../../games/core/types/GameDefinition";
import type {
  ContentMode,
  FigureSizeMode,
  GridSize,
  MaxGameSeconds,
  PlacementMode,
  PreviewSeconds,
  SwapCount,
  SwapDurationMs,
  SymbolSize,
} from "../../games/core/types/GameConfig";
import { useGameSession } from "../../features/game-session/hooks/useGameSession";
import {
  defaultFindCircleConfig,
  getFigureSizePercent,
  getFindCircleCorrectCount,
  getMaxCorrectObjectCount,
} from "../../games/find-circle/FindCircleConfig";
import type { GameDifficulty } from "../../games/core/types/GameDefinition";
import { ConfigTileGroup, type TileOption } from "../../components/ui/ConfigTileGroup";
import { ConfigSlider } from "../../components/ui/ConfigSlider";
import styles from "./GameConfigPage.module.css";

function createOption<T extends string | number>(
  id: T,
  label: string,
  description: string,
): TileOption<T> {
  return { id, label, description };
}

export function GameConfigPage() {
  const { gameKey = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
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
  const [swapDurationMs, setSwapDurationMs] = useState<SwapDurationMs>(600);
  const [difficulty, setDifficulty] = useState<GameDifficulty>("easy");
  const [symbolSize, setSymbolSize] = useState<SymbolSize>(52);

  useEffect(() => {
    void getGameByKey(gameKey).then(setGame);
  }, [gameKey]);

  const previewOptions = useMemo<TileOption<PreviewSeconds>[]>(() => [
    createOption(1, t("config.options.previewTime.1.label"), t("config.options.previewTime.1.description")),
    createOption(2, t("config.options.previewTime.2.label"), t("config.options.previewTime.2.description")),
    createOption(5, t("config.options.previewTime.5.label"), t("config.options.previewTime.5.description")),
    createOption(10, t("config.options.previewTime.10.label"), t("config.options.previewTime.10.description")),
  ], [t]);

  const maxGameTimeOptions = useMemo<TileOption<MaxGameSeconds>[]>(() => [
    createOption(30, t("config.options.maxGameTime.30.label"), t("config.options.maxGameTime.30.description")),
    createOption(60, t("config.options.maxGameTime.60.label"), t("config.options.maxGameTime.60.description")),
    createOption(90, t("config.options.maxGameTime.90.label"), t("config.options.maxGameTime.90.description")),
    createOption("unlimited", t("config.options.maxGameTime.unlimited.label"), t("config.options.maxGameTime.unlimited.description")),
  ], [t]);

  const gridOptions = useMemo<TileOption<GridSize>[]>(() => [
    createOption(2, t("config.options.gridSize.2.label"), t("config.options.gridSize.2.description")),
    createOption(3, t("config.options.gridSize.3.label"), t("config.options.gridSize.3.description")),
    createOption(4, t("config.options.gridSize.4.label"), t("config.options.gridSize.4.description")),
    createOption(5, t("config.options.gridSize.5.label"), t("config.options.gridSize.5.description")),
  ], [t]);

  const contentOptions = useMemo<TileOption<ContentMode>[]>(() => [
    createOption("figures", t("config.options.contentMode.figures.label"), t("config.options.contentMode.figures.description")),
    createOption("letters", t("config.options.contentMode.letters.label"), t("config.options.contentMode.letters.description")),
    createOption("numbers", t("config.options.contentMode.numbers.label"), t("config.options.contentMode.numbers.description")),
  ], [t]);

  const placementOptions = useMemo<TileOption<PlacementMode>[]>(() => [
    createOption("grid", t("config.options.placementMode.grid.label"), t("config.options.placementMode.grid.description")),
    createOption("random", t("config.options.placementMode.random.label"), t("config.options.placementMode.random.description")),
  ], [t]);

  const figureSizeOptions = useMemo<TileOption<FigureSizeMode>[]>(() => [
    createOption("fixed", t("config.options.figureSizeMode.fixed.label"), t("config.options.figureSizeMode.fixed.description")),
    createOption("random", t("config.options.figureSizeMode.random.label"), t("config.options.figureSizeMode.random.description")),
  ], [t]);

  const swapCountOptions = useMemo<TileOption<SwapCount>[]>(() => [
    createOption(5, t("config.options.swapCount.5.label"), t("config.options.swapCount.5.description")),
    createOption(10, t("config.options.swapCount.10.label"), t("config.options.swapCount.10.description")),
    createOption(15, t("config.options.swapCount.15.label"), t("config.options.swapCount.15.description")),
    createOption(20, t("config.options.swapCount.20.label"), t("config.options.swapCount.20.description")),
    createOption(25, t("config.options.swapCount.25.label"), t("config.options.swapCount.25.description")),
    createOption(30, t("config.options.swapCount.30.label"), t("config.options.swapCount.30.description")),
  ], [t]);

  const swapDurationOptions = useMemo<TileOption<SwapDurationMs>[]>(() => [
    createOption(200, t("config.options.swapDurationMs.200.label"), t("config.options.swapDurationMs.200.description")),
    createOption(400, t("config.options.swapDurationMs.400.label"), t("config.options.swapDurationMs.400.description")),
    createOption(600, t("config.options.swapDurationMs.600.label"), t("config.options.swapDurationMs.600.description")),
    createOption(800, t("config.options.swapDurationMs.800.label"), t("config.options.swapDurationMs.800.description")),
    createOption(1000, t("config.options.swapDurationMs.1000.label"), t("config.options.swapDurationMs.1000.description")),
    createOption(1200, t("config.options.swapDurationMs.1200.label"), t("config.options.swapDurationMs.1200.description")),
  ], [t]);

  const difficultyOptions = useMemo<TileOption<GameDifficulty>[]>(() => [
    createOption("easy", t("config.options.difficulty.easy.label"), t("config.options.difficulty.easy.description")),
    createOption("medium", t("config.options.difficulty.medium.label"), t("config.options.difficulty.medium.description")),
    createOption("hard", t("config.options.difficulty.hard.label"), t("config.options.difficulty.hard.description")),
  ], [t]);

  const maxCorrectObjectCount = useMemo(() => getMaxCorrectObjectCount(gridSize), [gridSize]);

  useEffect(() => {
    setCorrectObjectCount((current) => getFindCircleCorrectCount(gridSize, current));
  }, [gridSize]);

  function handleStart() {
    saveSessionState({
      gameKey,
      difficulty,
      findCircle: { previewSeconds, maxGameSeconds, gridSize, correctObjectCount, figureSizeMode, figureSizePercent, contentMode, placementMode },
      trackTheCircle: { swapCount, symbolSize, swapDurationMs },
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
      swapDurationMs: String(swapDurationMs),
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
        <span>{t("config.back")}</span>
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>{t("config.title")}</h1>
      </div>

      <div className={styles.panel}>
        {gameKey === "find-circle" && (
          <>
            <ConfigTileGroup title={t("config.labels.previewTime")} options={previewOptions} selected={previewSeconds} onChange={setPreviewSeconds} />
            <ConfigTileGroup title={t("config.labels.maxGameTime")} options={maxGameTimeOptions} selected={maxGameSeconds} onChange={setMaxGameSeconds} />
            <ConfigTileGroup title={t("config.labels.gridSize")} options={gridOptions} selected={gridSize} onChange={setGridSize} />
            <ConfigSlider
              title={t("config.labels.correctObjectCount")}
              hint={t("config.hints.correctObjectCount")}
              min={1}
              max={maxCorrectObjectCount}
              step={1}
              value={correctObjectCount}
              onChange={(v) => setCorrectObjectCount(getFindCircleCorrectCount(gridSize, v))}
            />
            <ConfigTileGroup title={t("config.labels.contentMode")} options={contentOptions} selected={contentMode} onChange={setContentMode} />
            <ConfigTileGroup title={t("config.labels.placementMode")} options={placementOptions} selected={placementMode} onChange={setPlacementMode} />
            <ConfigTileGroup title={t("config.labels.figureSizeMode")} options={figureSizeOptions} selected={figureSizeMode} onChange={setFigureSizeMode} />
            <ConfigSlider
              title={t("config.labels.figureSizePercent")}
              hint={t("config.hints.figureSizePercent")}
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
            <ConfigTileGroup title={t("config.labels.difficulty")} options={difficultyOptions} selected={difficulty} onChange={setDifficulty} />
            <ConfigTileGroup title={t("config.labels.swapCount")} options={swapCountOptions} selected={swapCount} onChange={setSwapCount} columns={3} />
            <ConfigTileGroup title={t("config.labels.swapDurationMs")} options={swapDurationOptions} selected={swapDurationMs} onChange={setSwapDurationMs} columns={3} />
            <ConfigSlider
              title={t("config.labels.symbolSize")}
              hint={t("config.hints.symbolSize")}
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
        {t("config.start")}
      </button>
    </main>
  );
}
