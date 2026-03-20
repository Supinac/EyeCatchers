import type { GameDifficulty } from "../types/GameDefinition";
import type { GameResult } from "../types/GameResult";
import { FindCircleGame } from "../../find-circle/FindCircleGame";
import { PlaceholderGame } from "../../placeholder/PlaceholderGame";

export type RegisteredGame = {
  key: string;
  render: (params: {
    mountElement: HTMLDivElement;
    difficulty: GameDifficulty;
    onComplete: (result: GameResult) => void;
  }) => () => void;
};

const registry: Record<string, RegisteredGame> = {
  "find-circle": FindCircleGame,
  "memory-pairs": PlaceholderGame("memory-pairs", "Memory Pairs"),
  "shape-match": PlaceholderGame("shape-match", "Shape Match"),
  "count-items": PlaceholderGame("count-items", "Count Items"),
  "find-different": PlaceholderGame("find-different", "Find Different"),
  "repeat-sequence": PlaceholderGame("repeat-sequence", "Repeat Sequence"),
};

export function getRegisteredGame(gameKey: string): RegisteredGame | null {
  return registry[gameKey] ?? null;
}
