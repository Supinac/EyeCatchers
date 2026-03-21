import type { FigureSizeMode, FindCircleGameConfig, GridSize, MaxGameSeconds, PreviewSeconds } from "../core/types/GameConfig";

export const defaultFindCircleConfig: FindCircleGameConfig = {
  previewSeconds: 10,
  maxGameSeconds: 60,
  gridSize: 3,
  figureSizeMode: "static",
};

export function getPreviewSeconds(value: number | null | undefined): PreviewSeconds {
  if (value === 5 || value === 10 || value === 15 || value === 20) return value;
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

export function getFindCircleCorrectCount(gridSize: GridSize) {
  return gridSize;
}
