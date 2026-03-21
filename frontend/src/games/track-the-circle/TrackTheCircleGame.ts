import type { RegisteredGame } from "../core/engine/GameRegistry";
import { mountTrackTheCircleScene } from "./TrackTheCircleScene";
import { getTrackConfig } from "./TrackTheCircleConfig";

export const TrackTheCircleGame: RegisteredGame = {
  key: "track-the-circle",
  render: ({ mountElement, difficulty, onComplete }) => {
    const config = getTrackConfig(difficulty);
    return mountTrackTheCircleScene({
      mountElement,
      difficulty,
      swapCount: config.defaultSwaps,
      onComplete,
    });
  },
};