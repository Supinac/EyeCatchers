import type { FigureSizeMode, FindCircleGameConfig, GridSize, MaxGameSeconds, PreviewSeconds } from "../core/types/GameConfig";

export const defaultFindCircleConfig: FindCircleGameConfig = {
  previewSeconds: 5,
  maxGameSeconds: 60,
  gridSize: 3,
  correctObjectCount: 3,
  figureSizeMode: "static",
};

export function getPreviewSeconds(value: number | null | undefined): PreviewSeconds {
  if (value === 1 || value === 2 || value === 5 || value === 10) return value;
  return defaultFindCircleConfig.previewSeconds;
}

export function getMaxGameSeconds(value: number | null | undefined): MaxGameSeconds {
  if (value === 30 || value === 60 || value === 90 || value === 120) return value;
  return defaultFindCircleConfig.maxGameSeconds;
}

export function getGridSize(value: number | null | undefined): GridSize {
  if (value === 2 || value === 3 || value === 4 || value === 5) return value;
  return defaultFindCircleConfig.gridSize;
}

export function getFigureSizeMode(value: string | null | undefined): FigureSizeMode {
  if (value === "random" || value === "static") return value;
  return defaultFindCircleConfig.figureSizeMode;
}

export function getMaxCorrectObjectCount(gridSize: GridSize) {
  return gridSize * gridSize;
}

export function getFindCircleCorrectCount(gridSize: GridSize, value?: number | null) {
  const maxCount = getMaxCorrectObjectCount(gridSize);
  const normalizedValue = Number.isFinite(value) ? Math.round(Number(value)) : defaultFindCircleConfig.correctObjectCount;
  return Math.min(maxCount, Math.max(1, normalizedValue));
}
