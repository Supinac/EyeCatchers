import type { FigureSizeMode, GridSize } from "../core/types/GameConfig";
import { getRandomInt } from "../core/utils/random";
import { getFindCircleCorrectCount } from "./FindCircleConfig";

export type ShapeKind = "circle" | "square" | "triangle" | "diamond" | "star";

const shapePool: ShapeKind[] = ["circle", "square", "triangle", "diamond", "star"];

export type FindCircleItem = {
  id: string;
  kind: ShapeKind;
  isCorrect: boolean;
  scale: number;
};

function getRandomScale(sizeMode: FigureSizeMode) {
  if (sizeMode === "static") return 1;
  const scales = [0.72, 0.82, 0.92, 1, 1.08, 1.16];
  return scales[getRandomInt(0, scales.length - 1)] ?? 1;
}

function shuffle<T>(items: T[]) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = getRandomInt(0, index);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

export function buildFindCircleRound({
  gridSize,
  sizeMode,
}: {
  gridSize: GridSize;
  sizeMode: FigureSizeMode;
}) {
  const cellCount = gridSize * gridSize;
  const targetKind = shapePool[getRandomInt(0, shapePool.length - 1)] ?? "circle";
  const correctCount = getFindCircleCorrectCount(gridSize);
  const wrongPool = shapePool.filter((shape) => shape !== targetKind);

  const correctItems: FindCircleItem[] = Array.from({ length: correctCount }, (_, index) => ({
    id: `correct_${index}`,
    kind: targetKind,
    isCorrect: true,
    scale: getRandomScale(sizeMode),
  }));

  const wrongItems: FindCircleItem[] = Array.from({ length: cellCount - correctCount }, (_, index) => ({
    id: `wrong_${index}`,
    kind: wrongPool[getRandomInt(0, wrongPool.length - 1)] ?? "square",
    isCorrect: false,
    scale: getRandomScale(sizeMode),
  }));

  return {
    targetKind,
    correctCount,
    items: shuffle([...correctItems, ...wrongItems]),
  };
}
