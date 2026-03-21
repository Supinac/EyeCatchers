import type { GameDifficulty } from "./GameDefinition";

export type PreviewSeconds = 1 | 2 | 5 | 10;
export type MaxGameSeconds = 30 | 60 | 90 | "unlimited";
export type GridSize = 2 | 3 | 4 | 5;
export type FigureSizeMode = "fixed" | "random";
export type ContentMode = "figures" | "letters" | "numbers";
export type PlacementMode = "grid" | "random";

export type FindCircleGameConfig = {
  previewSeconds: PreviewSeconds;
  maxGameSeconds: MaxGameSeconds;
  gridSize: GridSize;
  correctObjectCount: number;
  figureSizeMode: FigureSizeMode;
  figureSizePercent: number;
  contentMode: ContentMode;
  placementMode: PlacementMode;
};

export type GameConfig = {
  gameKey: string;
  difficulty: GameDifficulty;
  findCircle?: FindCircleGameConfig;
};
