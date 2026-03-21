import type { RegisteredGame } from "../core/engine/GameRegistry";
import { mountTrackTheCircleScene } from "./TrackTheCircleScene";
import { getTrackConfig } from "./TrackTheCircleConfig";

export const TrackTheCircleGame: RegisteredGame = {
  key: "track-the-circle",
  render: ({ mountElement, difficulty, onComplete }) => {
    const params = new URLSearchParams(window.location.search);
    const swapCount = params.get("swapCount")
      ? Number(params.get("swapCount"))
      : getTrackConfig(difficulty).defaultSwaps;

    return mountTrackTheCircleScene({
      mountElement,
      difficulty,
      swapCount,
      onComplete,
    });
  },
};