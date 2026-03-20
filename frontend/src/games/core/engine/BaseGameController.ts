import type { GameDifficulty } from "../types/GameDefinition";
import type { GameResult } from "../types/GameResult";

export type GameLaunchProps = {
  difficulty: GameDifficulty;
  onComplete: (result: GameResult) => void;
};
