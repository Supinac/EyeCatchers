import type { GameDifficulty } from "../../../games/core/types/GameDefinition";

export type SessionState = {
  gameKey: string;
  difficulty: GameDifficulty;
};
