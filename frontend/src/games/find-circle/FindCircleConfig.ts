import type { GameDifficulty } from "../core/types/GameDefinition";
import type { FigureSizeMode, FindCircleGameConfig, GridSize, PreviewSeconds } from "../core/types/GameConfig";

export const defaultFindCircleConfig: FindCircleGameConfig = {
  previewSeconds: 10,
  gridSize: 3,
  figureSizeMode: "static",
};

export function getPreviewSeconds(value: number | null | undefined): PreviewSeconds {
  if (value === 5 || value === 10 || value === 15 || value === 20) return value;
  return defaultFindCircleConfig.previewSeconds;
}

export function getGridSize(value: number | null | undefined): GridSize {
  if (value === 2 || value === 3 || value === 4 || value === 5) return value;
  return defaultFindCircleConfig.gridSize;
}

export function getFigureSizeMode(value: string | null | undefined): FigureSizeMode {
  if (value === "random" || value === "static") return value;
  return defaultFindCircleConfig.figureSizeMode;
}

export function getFindCircleCorrectCount(difficulty: GameDifficulty, gridSize: GridSize) {
  const cellCount = gridSize * gridSize;
  const base = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4;
  return Math.min(base, Math.max(1, Math.floor(cellCount / 2)));
}
