import type { GameDifficulty } from "../core/types/GameDefinition";

export function getFindCircleShapeCount(difficulty: GameDifficulty) {
  if (difficulty === "easy") return 4;
  if (difficulty === "medium") return 6;
  return 8;
}
