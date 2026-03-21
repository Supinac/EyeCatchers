import { mountFindCircleScene } from "./FindCircleScene";
import type { RegisteredGame } from "../core/engine/GameRegistry";
import { defaultFindCircleConfig } from "./FindCircleConfig";
import type { GameDifficulty } from "../core/types/GameDefinition";
import { getTrackConfig } from "../track-the-circle/TrackTheCircleConfig";
import { mountTrackTheCircleScene } from "../track-the-circle/TrackTheCircleScene";

export const FindCircleGame: RegisteredGame = {
  key: "find-circle",
  render: ({ mountElement, difficulty, config, onComplete }) => {
    return mountFindCircleScene({
      mountElement,
      difficulty,
      config: config?.findCircle ?? defaultFindCircleConfig,
      onComplete,
    });
  },
};

export const TrackTheCircleGame: RegisteredGame = {
  key: "track-the-circle",
  render: ({ mountElement, difficulty, onComplete }) => {
    const params = new URLSearchParams(window.location.search);
    const swapCount = params.get("swapCount")
      ? Number(params.get("swapCount"))
      : getTrackConfig(difficulty).defaultSwaps;
    const resolvedDifficulty = (params.get("difficulty") as GameDifficulty) ?? difficulty;

    return mountTrackTheCircleScene({
      mountElement,
      difficulty: resolvedDifficulty,
      swapCount,
      onComplete,
    });
  },
};