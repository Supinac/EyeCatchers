import type { GameDifficulty } from "../../../games/core/types/GameDefinition";
import type { FindCircleGameConfig } from "../../../games/core/types/GameConfig";

export type GameMode = "guided" | "free-play" | "single";
export type GameTimer = "none" | "short" | "relaxed";

export type SessionState = {
  gameKey: string;
  difficulty: GameDifficulty;
  mode?: GameMode;
  timer?: GameTimer;
  findCircle?: FindCircleGameConfig;
};
