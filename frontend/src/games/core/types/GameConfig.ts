import { KeysGameConfig } from "src/games/keys/KeysGameConfig";
import type { GameDifficulty } from "./GameDefinition";

export type PreviewSeconds = 5 | 10 | 15 | 20;
export type MaxGameSeconds = 30 | 60 | 90 | 120;
export type GridSize = 2 | 3 | 4 | 5;
export type FigureSizeMode = "static" | "random";

export type FindCircleGameConfig = {
  previewSeconds: PreviewSeconds;
  maxGameSeconds: MaxGameSeconds;
  gridSize: GridSize;
  figureSizeMode: FigureSizeMode;
};

export type GameConfig = {
  gameKey: string;
  difficulty: GameDifficulty;
  findCircle?: FindCircleGameConfig;
  keys?: KeysGameConfig;
};
