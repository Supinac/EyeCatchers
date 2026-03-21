import type {
  ContentMode,
  FigureSizeMode,
  FindCircleGameConfig,
  GridSize,
  MaxGameSeconds,
  PlacementMode,
  PreviewSeconds,
} from "../core/types/GameConfig";

export const defaultFindCircleConfig: FindCircleGameConfig = {
  previewSeconds: 5,
  maxGameSeconds: 60,
  gridSize: 3,
  correctObjectCount: 3,
  figureSizeMode: "fixed",
  figureSizePercent: 85,
  contentMode: "figures",
  placementMode: "grid",
};

export function getPreviewSeconds(value: number | string | null | undefined): PreviewSeconds {
  const normalizedValue = typeof value === "string" ? Number(value) : value;
  if (normalizedValue === 1 || normalizedValue === 2 || normalizedValue === 5 || normalizedValue === 10) return normalizedValue;
  return defaultFindCircleConfig.previewSeconds;
}

export function getMaxGameSeconds(value: number | string | null | undefined): MaxGameSeconds {
  if (value === "unlimited") return value;
  const normalizedValue = typeof value === "string" ? Number(value) : value;
  if (normalizedValue === 30 || normalizedValue === 60 || normalizedValue === 90) return normalizedValue;
  return defaultFindCircleConfig.maxGameSeconds;
}

export function isUnlimitedTime(value: MaxGameSeconds) {
  return value === "unlimited";
}

export function getGridSize(value: number | string | null | undefined): GridSize {
  const normalizedValue = typeof value === "string" ? Number(value) : value;
  if (normalizedValue === 2 || normalizedValue === 3 || normalizedValue === 4 || normalizedValue === 5) return normalizedValue;
  return defaultFindCircleConfig.gridSize;
}

export function getFigureSizeMode(value: string | null | undefined): FigureSizeMode {
  if (value === "random" || value === "fixed") return value;
  if (value === "static") return "fixed";
  return defaultFindCircleConfig.figureSizeMode;
}

export function getFigureSizePercent(value: number | string | null | undefined) {
  const normalizedValue = typeof value === "string" ? Number(value) : value;
  const fallback = defaultFindCircleConfig.figureSizePercent;
  const rounded = Number.isFinite(normalizedValue) ? Math.round(Number(normalizedValue)) : fallback;
  return Math.min(100, Math.max(40, rounded));
}

export function getContentMode(value: string | null | undefined): ContentMode {
  if (value === "figures" || value === "letters" || value === "numbers") return value;
  return defaultFindCircleConfig.contentMode;
}

export function getPlacementMode(value: string | null | undefined): PlacementMode {
  if (value === "grid" || value === "random") return value;
  return defaultFindCircleConfig.placementMode;
}

export function getMaxCorrectObjectCount(gridSize: GridSize) {
  return gridSize * gridSize;
}

export function getFindCircleCorrectCount(gridSize: GridSize, value?: number | null) {
  const maxCount = getMaxCorrectObjectCount(gridSize);
  const normalizedValue = Number.isFinite(value) ? Math.round(Number(value)) : defaultFindCircleConfig.correctObjectCount;
  return Math.min(maxCount, Math.max(1, normalizedValue));
}
