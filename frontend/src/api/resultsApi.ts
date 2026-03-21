import { request } from "./client";
import type { GameResult } from "../games/core/types/GameResult";

export type SubmitScoreEntry = {
  key: string;
  tranlations: string;
  value: string;
};

export type SubmitScoreMap = Record<string, SubmitScoreEntry>;

export type SubmitScoreRequest = {
  game_type: string;
  settings: SubmitScoreMap;
  results: SubmitScoreMap;
};

const GAME_TYPE_MAP: Record<string, string> = {
  "find-circle": "find_all_same",
  "memory-pairs": "memory_pairs",
  "shape-match": "shape_match",
  "count-items": "count_items",
  "find-different": "find_different",
  "repeat-sequence": "repeat_sequence",
};

function mapGameType(gameKey: string) {
  return GAME_TYPE_MAP[gameKey] ?? gameKey.replace(/-/g, "_");
}

function toEntry(key: string, tranlations: string, value: unknown): SubmitScoreEntry | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  if (typeof value === "boolean") {
    return {
      key,
      tranlations,
      value: value ? "true" : "false",
    };
  }

  return {
    key,
    tranlations,
    value: String(value),
  };
}

function toMap(entries: Array<SubmitScoreEntry | null>): SubmitScoreMap {
  return entries.reduce<SubmitScoreMap>((accumulator, entry) => {
    if (entry) {
      accumulator[entry.key] = entry;
    }

    return accumulator;
  }, {});
}

export function buildSubmitScoreRequest(result: GameResult): SubmitScoreRequest {
  const stats = result.stats;

  return {
    game_type: mapGameType(result.gameKey),
    settings: toMap([
      toEntry("difficulty", "Obtížnost", result.difficulty),
      stats?.previewSeconds != null ? toEntry("previewTime", "Doba náhledu", stats.previewSeconds) : null,
      stats?.maxGameSeconds != null ? toEntry("maxGameTime", "Maximální čas hry", stats.maxGameSeconds) : null,
      stats?.gridSize != null ? toEntry("gridSize", "Velikost mřížky", `${stats.gridSize}x${stats.gridSize}`) : null,
      stats?.correctObjectCount != null ? toEntry("correctObjectCount", "Počet správných objektů", stats.correctObjectCount) : null,
      stats?.figureSizeMode ? toEntry("figureSizeMode", "Režim velikosti objektů", stats.figureSizeMode) : null,
      stats?.figureSizePercent != null ? toEntry("figureSizePercent", "Velikost objektů v procentech", stats.figureSizePercent) : null,
      stats?.contentMode ? toEntry("contentMode", "Režim obsahu", stats.contentMode) : null,
      stats?.placementMode ? toEntry("placementMode", "Rozložení objektů", stats.placementMode) : null,
      stats?.targetValue ? toEntry("targetValue", "Hledaný objekt", stats.targetValue) : null,
    ]),
    results: toMap([
      toEntry("score", "Skóre", result.score),
      toEntry("maxScore", "Maximální skóre", result.maxScore),
      toEntry("success", "Úspěch", result.success),
      stats?.correctHits != null ? toEntry("correctHits", "Počet správných kliknutí", stats.correctHits) : null,
      stats?.wrongHits != null ? toEntry("wrongHits", "Počet špatných kliknutí", stats.wrongHits) : null,
      stats?.totalTaps != null ? toEntry("totalTaps", "Celkový počet kliknutí", stats.totalTaps) : null,
      stats?.accuracyPercent != null ? toEntry("accuracyPercent", "Přesnost v procentech", stats.accuracyPercent) : null,
      stats?.elapsedSeconds != null ? toEntry("elapsedSeconds", "Použitý čas v sekundách", stats.elapsedSeconds) : null,
      stats?.remainingSeconds != null ? toEntry("remainingSeconds", "Zbývající čas v sekundách", stats.remainingSeconds) : null,
    ]),
  };
}

export function submitScore(payload: SubmitScoreRequest) {
  return request<string>("/user/results", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
