import type { RegisteredGame } from "../core/engine/GameRegistry";
import { mountTrackTheCircleScene } from "./TrackTheCircleScene";
import { getTrackConfig } from "./TrackTheCircleConfig";
import type { GameDifficulty } from "../core/types/GameDefinition";

export const TrackTheCircleGame: RegisteredGame = {
  key: "track-the-circle",
  render: ({ mountElement, difficulty, onComplete }) => {
    const params = new URLSearchParams(window.location.search);

    const resolvedDifficulty = (params.get("difficulty") as GameDifficulty) ?? difficulty;

    const swapCount = params.get("swapCount")
      ? Number(params.get("swapCount"))
      : getTrackConfig(resolvedDifficulty).defaultSwaps;

    const symbolSize = params.get("symbolSize")
      ? Number(params.get("symbolSize"))
      : 52;

    return mountTrackTheCircleScene({
      mountElement,
      difficulty: resolvedDifficulty,
      swapCount,
      symbolSize,
      onComplete,
    });
  },
};