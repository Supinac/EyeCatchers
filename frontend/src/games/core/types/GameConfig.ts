import type { GameDifficulty } from "./GameDefinition";

export type PreviewSeconds = 5 | 10 | 15 | 20;
export type GridSize = 2 | 3 | 4 | 5;
export type FigureSizeMode = "static" | "random";

export type FindCircleGameConfig = {
  previewSeconds: PreviewSeconds;
  gridSize: GridSize;
  figureSizeMode: FigureSizeMode;
};

export type GameConfig = {
  gameKey: string;
  difficulty: GameDifficulty;
  findCircle?: FindCircleGameConfig;
};
