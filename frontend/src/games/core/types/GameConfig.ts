import type { GameDifficulty } from "./GameDefinition";

export type PreviewSeconds = 1 | 2 | 5 | 10;
export type MaxGameSeconds = 30 | 60 | 90 | 120;
export type GridSize = 2 | 3 | 4 | 5;
export type FigureSizeMode = "static" | "random";

export type FindCircleGameConfig = {
  previewSeconds: PreviewSeconds;
  maxGameSeconds: MaxGameSeconds;
  gridSize: GridSize;
  correctObjectCount: number;
  figureSizeMode: FigureSizeMode;
};

export type GameConfig = {
  gameKey: string;
  difficulty: GameDifficulty;
  findCircle?: FindCircleGameConfig;
};
