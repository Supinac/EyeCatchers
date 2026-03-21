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

export type AdminResultResponse = {
  id: number;
  user_id: number;
  game_type: string;
  settings: SubmitScoreMap | SubmitScoreEntry[] | string | null;
  results: SubmitScoreMap | SubmitScoreEntry[] | string | null;
  created_at?: string | null;
};

export type AdminGameResult = {
  id: string;
  userId: string;
  gameKey: string;
  gameTitle: string;
  playedAt: string;
  success: boolean;
  score: number | null;
  maxScore: number | null;
  difficulty: string;
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

const API_GAME_TO_FRONTEND_KEY: Record<string, string> = Object.entries(GAME_TYPE_MAP).reduce<Record<string, string>>((accumulator, [frontendKey, apiKey]) => {
  accumulator[apiKey] = frontendKey;
  return accumulator;
}, {});

function formatTitle(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapGameType(gameKey: string) {
  return GAME_TYPE_MAP[gameKey] ?? gameKey.replace(/-/g, "_");
}

function mapApiGameType(gameType: string) {
  return API_GAME_TO_FRONTEND_KEY[gameType] ?? gameType.replace(/_/g, "-");
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeEntry(candidate: unknown, fallbackKey?: string): SubmitScoreEntry | null {
  if (!isPlainObject(candidate)) {
    return null;
  }

  const key = typeof candidate.key === "string" && candidate.key.trim() ? candidate.key.trim() : fallbackKey;
  const tranlations = typeof candidate.tranlations === "string" ? candidate.tranlations : typeof candidate.translations === "string" ? candidate.translations : key ?? "";
  const value = candidate.value;

  if (!key || value == null) {
    return null;
  }

  return {
    key,
    tranlations,
    value: typeof value === "string" ? value : String(value),
  };
}

export function normalizeEntryMap(input: unknown): SubmitScoreMap {
  if (!input) {
    return {};
  }

  let parsedInput: unknown = input;

  if (typeof parsedInput === "string") {
    try {
      parsedInput = JSON.parse(parsedInput) as unknown;
    } catch {
      return {};
    }
  }

  if (Array.isArray(parsedInput)) {
    return parsedInput.reduce<SubmitScoreMap>((accumulator, item) => {
      const normalized = normalizeEntry(item);
      if (normalized) {
        accumulator[normalized.key] = normalized;
      }
      return accumulator;
    }, {});
  }

  if (isPlainObject(parsedInput)) {
    return Object.entries(parsedInput).reduce<SubmitScoreMap>((accumulator, [key, value]) => {
      const normalized = normalizeEntry(value, key);
      if (normalized) {
        accumulator[normalized.key] = normalized;
      }
      return accumulator;
    }, {});
  }

  return {};
}

function parseBoolean(value: string | undefined) {
  if (!value) {
    return false;
  }

  return value.trim().toLowerCase() === "true";
}

function parseNumber(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeAdminResult(item: AdminResultResponse): AdminGameResult {
  const settings = normalizeEntryMap(item.settings);
  const results = normalizeEntryMap(item.results);
  const gameKey = mapApiGameType(item.game_type);

  return {
    id: String(item.id),
    userId: String(item.user_id),
    gameKey,
    gameTitle: formatTitle(gameKey),
    playedAt: item.created_at ?? new Date(0).toISOString(),
    success: parseBoolean(results.success?.value),
    score: parseNumber(results.score?.value),
    maxScore: parseNumber(results.maxScore?.value),
    difficulty: settings.difficulty?.value ?? "",
    settings,
    results,
  };
}

export function normalizeAdminResults(items: AdminResultResponse[]) {
  return items
    .map(normalizeAdminResult)
    .sort((left, right) => new Date(right.playedAt).getTime() - new Date(left.playedAt).getTime());
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

export function getAdminResults() {
  return request<AdminResultResponse[]>("/admin/results", {
    method: "GET",
  });
}
