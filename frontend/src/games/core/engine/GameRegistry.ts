import type { GameDifficulty } from "../types/GameDefinition";
import type { GameResult } from "../types/GameResult";
import { FindCircleGame } from "../../find-circle/FindCircleGame";
import { PlaceholderGame } from "../../placeholder/PlaceholderGame";
import { TrackTheCircleGame } from "../../track-the-circle/TrackTheCircleGame";

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
  "track-the-circle": TrackTheCircleGame,
};

export function getRegisteredGame(gameKey: string): RegisteredGame | null {
  return registry[gameKey] ?? null;
}
