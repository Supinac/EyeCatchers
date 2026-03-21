import type { GameDifficulty } from "../core/types/GameDefinition";

export type SymbolType = "letter" | "number" | "shape";

export type TrackConfig = {
  circleCount: number;
  defaultSwaps: number;
};

export function getTrackConfig(difficulty: GameDifficulty): TrackConfig {
  if (difficulty === "easy")   return { circleCount: 3, defaultSwaps: 5  };
  if (difficulty === "medium") return { circleCount: 5, defaultSwaps: 10 };
  return                              { circleCount: 8, defaultSwaps: 15 };
}

export const SYMBOL_POOL: Record<SymbolType, string[]> = {
  letter: ["A", "B", "C", "D", "E", "F", "H", "I", "J", "K", "L", "M", "N"],
  number: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  shape:  ["circle", "square", "triangle"],
};

export const SYMBOL_TYPES: SymbolType[] = ["letter", "number", "shape"];

export const HIGHLIGHT_DURATION_MS = 5000;
export const SWAP_DURATION_MS = 600;
export const SWAP_PAUSE_MS = 200;