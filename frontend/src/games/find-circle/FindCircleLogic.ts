import type { GameDifficulty } from "../core/types/GameDefinition";
import { getFindCircleShapeCount } from "./FindCircleConfig";
import { getRandomInt } from "../core/utils/random";

export type ShapeKind = "circle" | "square" | "triangle";

const shapePool: ShapeKind[] = ["circle", "square", "triangle"];

export function buildFindCircleRound(difficulty: GameDifficulty) {
  const count = getFindCircleShapeCount(difficulty);
  const correctIndex = getRandomInt(0, count - 1);

  return Array.from({ length: count }, (_, index) => ({
    id: `shape_${index}`,
    kind: index === correctIndex ? "circle" : shapePool[getRandomInt(1, shapePool.length - 1)],
    isCorrect: index === correctIndex,
  }));
}
