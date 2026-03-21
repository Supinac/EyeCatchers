import type { ContentMode, FigureSizeMode, MaxGameSeconds, PlacementMode } from "./GameConfig";
import type { GameDifficulty } from "./GameDefinition";

export type GameResultStats = {
  correctHits: number;
  wrongHits: number;
  totalTaps: number;
  accuracyPercent: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  previewSeconds?: number;
  maxGameSeconds?: MaxGameSeconds;
  gridSize?: number;
  figureSizeMode?: FigureSizeMode;
  figureSizePercent?: number;
  correctObjectCount?: number;
  contentMode?: ContentMode;
  placementMode?: PlacementMode;
  targetValue?: string;
};

export type GameResult = {
  gameKey: string;
  difficulty: GameDifficulty;
  score: number;
  maxScore: number;
  success: boolean;
  stats?: GameResultStats;
};
