import type { GameDifficulty } from "./GameDefinition";

export type PreviewSeconds = 5 | 10 | 15 | 20;
export type MaxGameSeconds = 30 | 60 | 90 | 120;
export type GridSize = 2 | 3 | 4 | 5;
export type FigureSizeMode = "static" | "random";
export type SwapCount = 5 | 10 | 15 | 20 | 25 | 30;
export type SymbolSize = 32 | 36 | 40 | 44 | 48 | 52 | 56 | 60 | 64 | 68 | 72 | 76 | 80 | 84 | 88 | 92 | 96 | 100 | 104 | 108 | 112 | 116 | 120 | 124 | 128 | 132 | 136 | 140 | 144;

export type FindCircleGameConfig = {
  previewSeconds: PreviewSeconds;
  maxGameSeconds: MaxGameSeconds;
  gridSize: GridSize;
  figureSizeMode: FigureSizeMode;
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
