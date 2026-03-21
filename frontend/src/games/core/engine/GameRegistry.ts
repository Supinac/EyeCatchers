import type { GameDifficulty } from "../types/GameDefinition";
import type { GameResult } from "../types/GameResult";
import type { GameConfig } from "../types/GameConfig";
import { FindCircleGame } from "../../find-circle/FindCircleGame";
import { PlaceholderGame } from "../../placeholder/PlaceholderGame";
import { KeysGame } from "src/games/keys/KeysGame";

export type RegisteredGame = {
  key: string;
  render: (params: {
    mountElement: HTMLDivElement;
    difficulty: GameDifficulty;
    config?: GameConfig;
    onComplete: (result: GameResult) => void;
  }) => () => void;
};

const registry: Record<string, RegisteredGame> = {
  "find-circle": FindCircleGame,
  "memory-pairs": PlaceholderGame("memory-pairs", "Memory Pairs"),
  "keys": KeysGame,
  "count-items": PlaceholderGame("count-items", "Count Items"),
  "find-different": PlaceholderGame("find-different", "Find Different"),
  "repeat-sequence": PlaceholderGame("repeat-sequence", "Repeat Sequence"),
};

export function getRegisteredGame(gameKey: string): RegisteredGame | null {
  return registry[gameKey] ?? null;
}
