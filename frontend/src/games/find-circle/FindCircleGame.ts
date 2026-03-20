import { mountFindCircleScene } from "./FindCircleScene";
import type { RegisteredGame } from "../core/engine/GameRegistry";

export const FindCircleGame: RegisteredGame = {
  key: "find-circle",
  render: ({ mountElement, difficulty, onComplete }) => {
    return mountFindCircleScene({ mountElement, difficulty, onComplete });
  },
};
