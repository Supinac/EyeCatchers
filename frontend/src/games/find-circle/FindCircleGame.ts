import { mountFindCircleScene } from "./FindCircleScene";
import type { RegisteredGame } from "../core/engine/GameRegistry";
import { defaultFindCircleConfig } from "./FindCircleConfig";

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