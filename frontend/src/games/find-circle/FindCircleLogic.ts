import type { ContentMode, FigureSizeMode, GridSize } from "../core/types/GameConfig";
import { getRandomInt } from "../core/utils/random";
import { getFindCircleCorrectCount, getFigureSizePercent } from "./FindCircleConfig";

export type ShapeKind = "circle" | "square" | "triangle" | "diamond" | "star";
export type SymbolContentType = "shape" | "text";

const shapePool: ShapeKind[] = ["circle", "square", "triangle", "diamond", "star"];
const letterPool = ["A", "B", "C", "Č", "D", "E", "Ě", "F", "G", "H", "I", "J", "K", "L", "M", "N", "Ň", "O", "P", "R", "Ř", "S", "Š", "T", "U", "V", "Y", "Z", "Ž"];
const numberPool = "0123456789".split("");

export type FindCircleItem = {
  id: string;
  value: string;
  contentType: SymbolContentType;
  isCorrect: boolean;
  scale: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getItemScale(sizeMode: FigureSizeMode, sizePercent: number) {
  const baseScale = getFigureSizePercent(sizePercent) / 100;

  if (sizeMode === "fixed") {
    return baseScale;
  }

  const randomFactors = [0.72, 0.86, 1, 1.16, 1.32];
  const factor = randomFactors[getRandomInt(0, randomFactors.length - 1)] ?? 1;
  return clamp(baseScale * factor, 0.35, 1.35);
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
  sizePercent,
  correctCount,
  contentMode,
}: {
  gridSize: GridSize;
  sizeMode: FigureSizeMode;
  sizePercent: number;
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
    scale: getItemScale(sizeMode, sizePercent),
  }));

  const wrongItems: FindCircleItem[] = Array.from({ length: cellCount - normalizedCorrectCount }, (_, index) => ({
    id: `wrong_${index}`,
    value: wrongPool[getRandomInt(0, wrongPool.length - 1)] ?? wrongPool[0] ?? targetValue,
    contentType: source.contentType,
    isCorrect: false,
    scale: getItemScale(sizeMode, sizePercent),
  }));

  return {
    targetValue,
    targetLabel: source.label,
    correctCount: normalizedCorrectCount,
    items: shuffle([...correctItems, ...wrongItems]),
  };
}
