import type { GameDifficulty } from "./GameDefinition";

export type GameResult = {
  gameKey: string;
  difficulty: GameDifficulty;
  score: number;
  maxScore: number;
  success: boolean;
};
