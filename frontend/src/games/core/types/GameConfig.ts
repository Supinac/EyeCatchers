import type { GameDifficulty } from "./GameDefinition";

export type PreviewSeconds = 1 | 2 | 5 | 10;
export type MaxGameSeconds = 30 | 60 | 90 | "unlimited";
export type GridSize = 2 | 3 | 4 | 5;
export type FigureSizeMode = "fixed" | "random";
export type ContentMode = "figures" | "letters" | "numbers";
export type PlacementMode = "grid" | "random";
export type SwapCount = 5 | 10 | 15 | 20 | 25 | 30;
export type SymbolSize = 32 | 36 | 40 | 44 | 48 | 52 | 56 | 60 | 64 | 68 | 72 | 76 | 80 | 84 | 88 | 92 | 96 | 100 | 104 | 108 | 112 | 116 | 120 | 124 | 128 | 132 | 136 | 140 | 144;

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

export type TrackTheCircleGameConfig = {
  swapCount: SwapCount;
  symbolSize: SymbolSize;
};

export type GameConfig = {
  gameKey: string;
  difficulty: GameDifficulty;
  findCircle?: FindCircleGameConfig;
  trackTheCircle?: TrackTheCircleGameConfig;
};
