import type { ContentMode, FigureSizeMode, PlacementMode } from "./GameConfig";
import type { GameDifficulty } from "./GameDefinition";

export type GameResultStats = {
  correctHits: number;
  wrongHits: number;
  totalTaps: number;
  accuracyPercent: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  previewSeconds?: number;
  maxGameSeconds?: number;
  gridSize?: number;
  figureSizeMode?: FigureSizeMode;
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
