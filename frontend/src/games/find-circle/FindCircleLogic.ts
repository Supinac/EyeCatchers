import type { ContentMode, FigureSizeMode, GridSize } from "../core/types/GameConfig";
import { getRandomInt } from "../core/utils/random";
import { getFindCircleCorrectCount } from "./FindCircleConfig";

export type ShapeKind = "circle" | "square" | "triangle" | "diamond" | "star";
export type SymbolContentType = "shape" | "text";

const shapePool: ShapeKind[] = ["circle", "square", "triangle", "diamond", "star"];
const letterPool = ["A", "B", "C", "Č", "D", "Ď", "E", "Ě", "F", "G", "H", "I", "J", "K", "L", "M", "N", "Ň", "O", "P", "R", "Ř", "S", "Š", "T", "Ť", "U", "Ů", "V", "Y", "Z", "Ž"];
const numberPool = "0123456789".split("");

export type FindCircleItem = {
  id: string;
  value: string;
  contentType: SymbolContentType;
  isCorrect: boolean;
  scale: number;
};

function getRandomScale(sizeMode: FigureSizeMode) {
  if (sizeMode === "static") return 1;
  const scales = [0.55, 0.75, 1, 1.25, 1.5];
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

function getPoolByMode(contentMode: ContentMode) {
  if (contentMode === "letters") {
    return {
      contentType: "text" as const,
      pool: letterPool,
      label: "letter",
    };
  }

  if (contentMode === "numbers") {
    return {
      contentType: "text" as const,
      pool: numberPool,
      label: "number",
    };
  }

  return {
    contentType: "shape" as const,
    pool: shapePool,
    label: "figure",
  };
}

export function buildFindCircleRound({
  gridSize,
  sizeMode,
  correctCount,
  contentMode,
}: {
  gridSize: GridSize;
  sizeMode: FigureSizeMode;
  correctCount: number;
  contentMode: ContentMode;
}) {
  const cellCount = gridSize * gridSize;
  const normalizedCorrectCount = getFindCircleCorrectCount(gridSize, correctCount);
  const source = getPoolByMode(contentMode);
  const targetValue = source.pool[getRandomInt(0, source.pool.length - 1)] ?? source.pool[0] ?? "?";
  const wrongPool = source.pool.filter((entry) => entry !== targetValue);

  const correctItems: FindCircleItem[] = Array.from({ length: normalizedCorrectCount }, (_, index) => ({
    id: `correct_${index}`,
    value: targetValue,
    contentType: source.contentType,
    isCorrect: true,
    scale: getRandomScale(sizeMode),
  }));

  const wrongItems: FindCircleItem[] = Array.from({ length: cellCount - normalizedCorrectCount }, (_, index) => ({
    id: `wrong_${index}`,
    value: wrongPool[getRandomInt(0, wrongPool.length - 1)] ?? wrongPool[0] ?? targetValue,
    contentType: source.contentType,
    isCorrect: false,
    scale: getRandomScale(sizeMode),
  }));

  return {
    targetValue,
    targetLabel: source.label,
    correctCount: normalizedCorrectCount,
    items: shuffle([...correctItems, ...wrongItems]),
  };
}
