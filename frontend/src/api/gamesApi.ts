import { simulateDelay } from "./client";
import type { GameCatalogItem, GameDifficulty } from "../games/core/types/GameDefinition";

const games: GameCatalogItem[] = [
  { key: "find-circle", name: "Game", enabled: true, implemented: true },
  { key: "memory-pairs", name: "Memory Pairs", enabled: true, implemented: false },
  { key: "shape-match", name: "Shape Match", enabled: true, implemented: false },
  { key: "count-items", name: "Count Items", enabled: true, implemented: false },
  { key: "find-different", name: "Find Different", enabled: true, implemented: false },
  { key: "repeat-sequence", name: "Repeat Sequence", enabled: true, implemented: false },
  { key: "keys", name: "Klíče", enabled: true, implemented: true },
];

const difficultyConfig: Record<string, GameDifficulty[]> = {
  "find-circle": ["easy", "medium", "hard"],
  "memory-pairs": ["easy", "medium", "hard"],
  "shape-match": ["easy", "medium", "hard"],
  "count-items": ["easy", "medium", "hard"],
  "find-different": ["easy", "medium", "hard"],
  "repeat-sequence": ["easy", "medium", "hard"],
  "keys": ["easy", "medium", "hard"],
};

export async function getGames(): Promise<GameCatalogItem[]> {
  return simulateDelay(games, 250);
}

export async function getGameByKey(gameKey: string): Promise<GameCatalogItem | null> {
  const found = games.find((game) => game.key === gameKey) ?? null;
  return simulateDelay(found, 150);
}

export async function getGameDifficulties(gameKey: string): Promise<GameDifficulty[]> {
  return simulateDelay(difficultyConfig[gameKey] ?? ["easy"], 150);
}
